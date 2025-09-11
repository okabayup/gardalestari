
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

export interface Achievement {
  id?: string;
  userId: string;
  userName: string; // Denormalized for easy display
  userAvatar: string; // Denormalized for easy display
  title: string;
  description: string;
  date: Timestamp;
  imageUrl?: string;
}

const achievementsCollection = collection(db, 'achievements');

// Get all achievements, ordered by date
export async function getAchievements(): Promise<Achievement[]> {
  const q = query(achievementsCollection, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  const achievements: Achievement[] = [];
  snapshot.forEach(doc => {
    achievements.push({ id: doc.id, ...doc.data() } as Achievement);
  });
  return achievements;
}

// Get a single achievement by ID
export async function getAchievement(id: string): Promise<Achievement | null> {
    const docRef = doc(db, 'achievements', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Achievement;
    }
    return null;
}

// Create a new achievement
export async function createAchievement(data: Omit<Achievement, 'id'>, imageFile?: File) {
  try {
    const achievementData: Omit<Achievement, 'id'> = { ...data };
    if (imageFile) {
        const imageRef = ref(storage, `achievements/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        achievementData.imageUrl = await getDownloadURL(imageRef);
    }
    await addDoc(achievementsCollection, achievementData);
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
  } catch (error) {
    console.error("Error creating achievement:", error);
    throw new Error("Gagal membuat data prestasi.");
  }
}

// Update an existing achievement
export async function updateAchievement(id: string, data: Partial<Omit<Achievement, 'id'>>, imageFile?: File) {
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
                    console.warn("Could not delete old image", storageError);
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
  } catch (error) {
    console.error("Error updating achievement:", error);
    throw new Error("Gagal memperbarui prestasi.");
  }
}

// Delete an achievement
export async function deleteAchievement(id: string) {
  try {
    const docToDelete = await getAchievement(id);
    if (docToDelete?.imageUrl) {
        await deleteObject(ref(storage, docToDelete.imageUrl));
    }
    await deleteDoc(doc(db, 'achievements', id));
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
  } catch (error) {
    console.error("Error deleting achievement:", error);
    throw new Error("Gagal menghapus prestasi.");
  }
}
