
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, arrayUnion, arrayRemove } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Badge } from '@/lib/definitions';

const badgesCollection = collection(db, 'badges');

export async function getBadges(): Promise<Badge[]> {
  try {
    const q = query(badgesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
  } catch (error) {
    console.error("[getBadges Error]", error);
    throw new Error("Gagal mengambil data lencana.");
  }
}

export async function createBadge(data: Omit<Badge, 'id' | 'createdAt'>) {
  try {
    await addDoc(badgesCollection, { ...data, createdAt: Timestamp.now() });
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error("[createBadge Error]", error);
    throw new Error(`Gagal membuat lencana: ${(error as Error).message}`);
  }
}

export async function updateBadge(id: string, data: Partial<Omit<Badge, 'id' | 'createdAt'>>) {
    try {
        const docRef = doc(db, 'badges', id);
        await updateDoc(docRef, data);
        revalidatePath('/panel/badges');
    } catch (error) {
        console.error("[updateBadge Error]", error);
        throw new Error(`Gagal memperbarui lencana: ${(error as Error).message}`);
    }
}

export async function deleteBadge(id: string) {
  try {
    // Note: This doesn't remove the badge from users who have it.
    // A more complex migration would be needed for that.
    await deleteDoc(doc(db, 'badges', id));
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error("[deleteBadge Error]", error);
    throw new Error("Gagal menghapus lencana.");
  }
}


export async function assignBadgeToUser(userId: string, badgeId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            assignedBadges: arrayUnion(badgeId)
        });
        revalidatePath(`/profile/me`);
    } catch(error) {
        console.error("[assignBadgeToUser Error]", error);
        throw new Error("Gagal memberikan lencana.");
    }
}

export async function removeBadgeFromUser(userId: string, badgeId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            assignedBadges: arrayRemove(badgeId)
        });
         revalidatePath(`/profile/me`);
    } catch(error) {
        console.error("[removeBadgeFromUser Error]", error);
        throw new Error("Gagal mencabut lencana.");
    }
}
