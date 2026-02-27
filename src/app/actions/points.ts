
'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  Timestamp,
  orderBy,
  runTransaction,
  increment,
  limit,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { RedeemableItem, Mission, RedemptionLog, PointLog, BadgeMetric } from '@/lib/definitions';
import { getUserByUid } from '@/app/actions/user';

// Local constants (not exported)
const redeemableItemsCollection = collection(db, 'redeemableItems');
const missionsCollection = collection(db, 'missions');
const redemptionLogsCollection = collection(db, 'redemptionLogs');
const usersCollection = collection(db, 'users');


// --- Redeemable Items Management (Admin) ---

export async function getRedeemableItems(): Promise<RedeemableItem[]> {
  const snapshot = await getDocs(query(redeemableItemsCollection, orderBy('pointsRequired', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedeemableItem));
}

export async function createRedeemableItem(data: Omit<RedeemableItem, 'id' | 'imageUrl'>, imageDataUri?: string) {
  const dataToCreate: { [key: string]: any } = { ...data };
  
  if (imageDataUri) {
    const imageRef = ref(storage, `redeem-items/${Date.now()}_item.jpg`);
    await uploadString(imageRef, imageDataUri, 'data_url', { contentType: 'image/jpeg' });
    dataToCreate.imageUrl = await getDownloadURL(imageRef);
  }
  await addDoc(redeemableItemsCollection, dataToCreate);
  revalidatePath('/panel/redeem');
  revalidatePath('/points');
}

export async function updateRedeemableItem(id: string, data: Partial<Omit<RedeemableItem, 'id' | 'imageUrl'>>, imageDataUri?: string) {
  const itemRef = doc(redeemableItemsCollection, id);
  const updateData: { [key: string]: any } = { ...data };
  if (imageDataUri) {
    const imageRef = ref(storage, `redeem-items/${Date.now()}_${id}.jpg`);
    await uploadString(imageRef, imageDataUri, 'data_url', { contentType: 'image/jpeg' });
    updateData.imageUrl = await getDownloadURL(imageRef);
  }
  await updateDoc(itemRef, updateData);
  revalidatePath('/panel/redeem');
  revalidatePath('/points');
}

export async function deleteRedeemableItem(id: string) {
  const docRef = redeemableItemsCollection;
  const itemDoc = await getDoc(doc(docRef, id));
  if (itemDoc.exists() && itemDoc.data().imageUrl) {
      try {
        const imageRef = ref(storage, itemDoc.data().imageUrl);
        await deleteObject(imageRef);
      } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
              console.warn(`[deleteRedeemableItem] Failed to delete image for item ${id}:`, error);
          }
      }
  }
  await deleteDoc(doc(docRef, id));
  revalidatePath('/panel/redeem');
  revalidatePath('/points');
}


// --- Missions Management (Admin) ---

export async function getMissions(): Promise<Mission[]> {
  const snapshot = await getDocs(query(missionsCollection, orderBy('name', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
}

export async function createMission(data: Omit<Mission, 'id'>) {
  await addDoc(missionsCollection, { ...data });
  revalidatePath('/panel/missions');
  revalidatePath('/points');
}

export async function updateMission(id: string, data: Partial<Mission>) {
  await updateDoc(doc(db, 'missions', id), data);
  revalidatePath('/panel/missions');
  revalidatePath('/points');
}

export async function deleteMission(id: string) {
  await deleteDoc(doc(db, 'missions', id));
  revalidatePath('/panel/missions');
  revalidatePath('/points');
}


// --- Redemption Logic (User & Admin) ---

export async function redeemItem(userId: string, itemId: string) {
    const userRef = doc(usersCollection, userId);
    const itemRef = doc(redeemableItemsCollection, itemId);

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const itemDoc = await transaction.get(itemRef);

        if (!userDoc.exists()) throw new Error("Pengguna tidak ditemukan.");
        if (!itemDoc.exists()) throw new Error("Item tidak ditemukan.");
        
        const userPoints = userDoc.data().greenPoints || 0;
        const itemData = itemDoc.data() as RedeemableItem;

        if (userPoints < itemData.pointsRequired) {
            throw new Error("Poin tidak mencukupi.");
        }
        if (itemData.stock <= 0) {
            throw new Error("Stok item habis.");
        }
        
        const logsCollection = collection(userRef, 'pointLogs');
        const redemptionLogRef = doc(redemptionLogsCollection);
        const pointLogRef = doc(logsCollection);

        transaction.update(userRef, { greenPoints: increment(-itemData.pointsRequired) });
        transaction.update(itemRef, { stock: increment(-1) });
        
        transaction.set(redemptionLogRef, {
            userId: userId,
            userName: userDoc.data().fullName,
            itemId: itemId,
            itemName: itemData.name,
            pointsSpent: itemData.pointsRequired,
            redeemedAt: Timestamp.now(),
        });
        
        transaction.set(pointLogRef, {
            points: -itemData.pointsRequired,
            description: `Menukar item: ${itemData.name}`,
            createdAt: Timestamp.now()
        });

    });

    revalidatePath('/points');
    revalidatePath('/panel/redeem/history');
}

export async function getRedemptionHistory(): Promise<RedemptionLog[]> {
    const snapshot = await getDocs(query(redemptionLogsCollection, orderBy('redeemedAt', 'desc')));
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            ...data,
            id: docSnap.id,
            redeemedAt: (data.redeemedAt as Timestamp).toDate().toISOString(),
        } as RedemptionLog
    });
}

/**
 * Gets the point history for a specific user.
 */
export async function getPointHistory(userId: string): Promise<PointLog[]> {
    try {
        const userRef = doc(usersCollection, userId);
        const logsCollection = collection(userRef, 'pointLogs');
        const q = query(logsCollection, orderBy('createdAt', 'desc'), limit(50));
        
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                points: data.points,
                description: data.description,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as PointLog;
        });

    } catch (error) {
        console.error(`[getPointHistory Error] for user ${userId}:`, error);
        throw new Error('Gagal mengambil riwayat poin.');
    }
}

/**
 * Awards points to a user for a specific action and creates a log entry.
 */
export async function awardPointsForAction(actionType: Mission['type'] | BadgeMetric, userId: string, description: string, level: number = 1) {
    const userRef = doc(usersCollection, userId);

    const filterField = actionType === 'referral' ? 'type' : 'criteria.metric';
    const missionsQuery = query(missionsCollection, where(filterField, '==', actionType), limit(1));
    const missionsSnapshot = await getDocs(missionsQuery);
    
    if (missionsSnapshot.empty) {
        console.warn(`[awardPoints] No mission found for action type: ${actionType}.`);
        return;
    }

    const mission = missionsSnapshot.docs[0].data() as Mission;
    let pointsToAward = 0;
    
    if (actionType === 'referral' && mission.pointsPerLevel) {
        if (level > 0 && level <= mission.pointsPerLevel.length) {
            pointsToAward = mission.pointsPerLevel[level - 1] || 0;
        }
    } else if (mission.points) {
        pointsToAward = mission.points;
    }

    if (pointsToAward <= 0) {
        console.warn(`[awardPoints] No points to award for mission ${mission.name} to user ${userId}.`);
        return;
    }

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User not found");
        }
        
        const pointLogRef = doc(collection(userRef, 'pointLogs'));

        transaction.update(userRef, { greenPoints: increment(pointsToAward) });
        transaction.set(pointLogRef, {
            points: pointsToAward,
            description: description,
            createdAt: Timestamp.now(),
        });
    });

     revalidatePath(`/points`);
}
