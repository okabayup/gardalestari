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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { RedeemableItem, Mission, RedemptionLog } from '@/lib/definitions';

const redeemableItemsCollection = collection(db, 'redeemableItems');
const missionsCollection = collection(db, 'missions');
const redemptionLogsCollection = collection(db, 'redemptionLogs');
const usersCollection = collection(db, 'users');


// --- Redeemable Items Management (Admin) ---

export async function getRedeemableItems(): Promise<RedeemableItem[]> {
  const snapshot = await getDocs(query(redeemableItemsCollection, orderBy('pointsRequired', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedeemableItem));
}

export async function createRedeemableItem(data: Omit<RedeemableItem, 'id' | 'imageUrl'>, imageFile?: File) {
  let imageUrl: string | undefined = undefined;
  if (imageFile) {
    const imageRef = ref(storage, `redeem-items/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }
  await addDoc(redeemableItemsCollection, { ...data, imageUrl });
  revalidatePath('/panel/redeem');
}

export async function updateRedeemableItem(id: string, data: Partial<Omit<RedeemableItem, 'id' | 'imageUrl'>>, imageFile?: File) {
  const itemRef = doc(db, 'redeemableItems', id);
  const updateData: { [key: string]: any } = { ...data };
  if (imageFile) {
    const imageRef = ref(storage, `redeem-items/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    updateData.imageUrl = await getDownloadURL(imageRef);
  }
  await updateDoc(itemRef, updateData);
  revalidatePath('/panel/redeem');
}

export async function deleteRedeemableItem(id: string) {
  await deleteDoc(doc(db, 'redeemableItems', id));
  // Note: Does not delete image from storage to prevent accidental data loss.
  revalidatePath('/panel/redeem');
}


// --- Missions Management (Admin) ---

export async function getMissions(): Promise<Mission[]> {
  const snapshot = await getDocs(query(missionsCollection, orderBy('points', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
}

export async function createMission(data: Omit<Mission, 'id'>) {
  await addDoc(missionsCollection, data);
  revalidatePath('/panel/missions');
}

export async function updateMission(id: string, data: Partial<Mission>) {
  await updateDoc(doc(db, 'missions', id), data);
  revalidatePath('/panel/missions');
}

export async function deleteMission(id: string) {
  await deleteDoc(doc(db, 'missions', id));
  revalidatePath('/panel/missions');
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

        // Deduct points, decrement stock, and log the redemption
        transaction.update(userRef, { greenPoints: increment(-itemData.pointsRequired) });
        transaction.update(itemRef, { stock: increment(-1) });

        const logRef = doc(redemptionLogsCollection);
        transaction.set(logRef, {
            userId: userId,
            userName: userDoc.data().fullName,
            itemId: itemId,
            itemName: itemData.name,
            pointsSpent: itemData.pointsRequired,
            redeemedAt: Timestamp.now(),
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
