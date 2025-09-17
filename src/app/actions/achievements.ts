
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, where, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { Achievement } from '@/lib/definitions';
import { auth } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/lib/firebase-admin';

const achievementsCollection = collection(db, 'achievements');

// === Public Functions for AI Tool ===

/**
 * Searches the achievements based on a query.
 * To be used by an AI tool.
 * @param searchQuery The keywords to search for.
 * @returns A list of relevant achievements.
 */
export async function searchAchievements(searchQuery: string): Promise<Partial<Achievement>[]> {
  try {
    const q = query(
        achievementsCollection,
        orderBy('date', 'desc'),
        limit(20)
    );

    const snapshot = await getDocs(q);
    const allEntries: Achievement[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));

    const searchTerms = searchQuery.toLowerCase().split(' ');
    const results = allEntries.filter(entry => {
        const searchableText = `${entry.title} ${entry.description} ${entry.userName}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
    }).slice(0, 5); // Return top 5 matches

    return results.map(entry => ({
        id: entry.id,
        title: entry.title,
        userName: entry.userName,
        date: entry.date,
    }));
  } catch (error) {
    console.error("[searchAchievements Error]", error);
    throw new Error("Gagal mencari data prestasi.");
  }
}


// Get all achievements, ordered by date
export async function getAchievements(): Promise<Achievement[]> {
  try {
    const q = query(achievementsCollection, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
  } catch (error) {
    console.error("[getAchievements Error]", error);
    throw new Error("Gagal mengambil data prestasi.");
  }
}

// Get all achievements for a specific user
export async function getAchievementsByUserId(userId: string): Promise<Achievement[]> {
  try {
    const q = query(achievementsCollection, where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
  } catch (error) {
    console.error("[getAchievementsByUserId Error]", error);
    throw new Error("Gagal mengambil data prestasi pengguna.");
  }
}


// Get a single achievement by ID
export async function getAchievement(id: string): Promise<Achievement | null> {
    try {
        const docRef = doc(db, 'achievements', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Achievement;
        }
        return null;
    } catch (error) {
        console.error("[getAchievement Error]", error);
        throw new Error("Gagal mengambil data prestasi tunggal.");
    }
}

// Create a new achievement (for admins)
export async function createAchievement(data: Omit<Achievement, 'id' | 'date'> & { date: Timestamp }, imageFile?: File) {
  try {
    const achievementData: { [key: string]: any } = { ...data };
    if (imageFile) {
        const imageRef = ref(storage, `achievements/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        achievementData.imageUrl = await getDownloadURL(imageRef);
    }
    await addDoc(achievementsCollection, achievementData);
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
  } catch (error) {
    console.error("[createAchievement Error]", error);
    throw new Error("Gagal membuat data prestasi.");
  }
}

// Create a new achievement for the currently logged-in user
export async function createMyAchievement(
  data: Omit<Achievement, 'id' | 'userId' | 'userName' | 'userAvatar' | 'date'> & { date: Timestamp },
  userId: string,
  imageFile?: File,
) {
    try {
        await initializeAdminApp();
        const auth = getAuth();
        const user = await auth.getUser(userId);

        if (!user) {
            throw new Error('User not found.');
        }

        const achievementData: Omit<Achievement, 'id' | 'date'> & { date: Timestamp } = {
            ...data,
            userId: user.uid,
            userName: user.displayName || 'Pengguna',
            userAvatar: user.photoURL || '',
        };
        
        if (imageFile) {
            const imageRef = ref(storage, `achievements/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            (achievementData as any).imageUrl = await getDownloadURL(imageRef);
        }
        await addDoc(achievementsCollection, achievementData);
        revalidatePath('/achievements');
        revalidatePath('/profile/me');
    } catch (error) {
        console.error("[createMyAchievement Error]", error);
        throw new Error("Gagal menambahkan prestasi Anda.");
    }
}


// Update an existing achievement
export async function updateAchievement(id: string, data: Partial<Omit<Achievement, 'id' | 'date'>> & { date?: Timestamp }, imageFile?: File) {
  try {
    const docRef = doc(db, 'achievements', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    if (imageFile) {
        const currentDoc = await getAchievement(id);
        if (currentDoc?.imageUrl) {
            try {
                await deleteObject(ref(storage, currentDoc.imageUrl));
            } catch (storageError: any) {
                 if (storageError.code !== 'storage/object-not-found') {
                    console.warn("[updateAchievement Warn] Could not delete old image", storageError);
                }
            }
        }
        const imageRef = ref(storage, `achievements/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        dataToUpdate.imageUrl = await getDownloadURL(imageRef);
    }
    
    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/achievements');
    revalidatePath(`/achievements`);
    revalidatePath('/profile/me');
  } catch (error) {
    console.error("[updateAchievement Error]", error);
    throw new Error("Gagal memperbarui prestasi.");
  }
}

// Delete an achievement
export async function deleteAchievement(id: string) {
  try {
    const docToDelete = await getAchievement(id);
    if (docToDelete?.imageUrl) {
        try {
            await deleteObject(ref(storage, docToDelete.imageUrl));
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.warn("[deleteAchievement Warn] Old image not found, skipping deletion.", storageError);
            }
        }
    }
    await deleteDoc(doc(db, 'achievements', id));
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error("[deleteAchievement Error]", error);
    throw new Error("Gagal menghapus prestasi.");
  }
}
