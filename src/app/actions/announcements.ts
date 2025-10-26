
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { Announcement } from '@/lib/definitions';

const announcementsCollection = collection(db, 'announcements');

const toAnnouncement = (doc: any): Announcement => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as Announcement;
};


// Get all announcements, ordered by creation date
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const q = query(announcementsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toAnnouncement);
  } catch (error) {
    console.error("Error getting announcements:", error);
    throw new Error("Gagal mengambil data pengumuman.");
  }
}

// Get a single announcement by ID
export async function getAnnouncement(id: string): Promise<Announcement | null> {
    try {
        const docRef = doc(db, 'announcements', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return toAnnouncement(docSnap);
        }
        return null;
    } catch (error) {
        console.error("Error getting single announcement:", error);
        throw new Error("Gagal mengambil data pengumuman.");
    }
}

// Create a new announcement
export async function createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>, attachmentFile?: File) {
  try {
    const announcementData: { [key: string]: any } = { 
        ...data,
        createdAt: Timestamp.now()
    };
    if (attachmentFile) {
        const attachmentRef = ref(storage, `announcements/${Date.now()}_${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        announcementData.attachmentUrl = await getDownloadURL(attachmentRef);
        announcementData.attachmentName = attachmentFile.name;
    }
    await addDoc(announcementsCollection, announcementData);
    revalidatePath('/panel/announcements');
    revalidatePath('/announcements'); // Assuming a public page might exist
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw new Error(`Gagal membuat pengumuman: ${(error as Error).message}`);
  }
}

// Update an existing announcement
export async function updateAnnouncement(id: string, data: Partial<Omit<Announcement, 'id' | 'createdAt'>>, attachmentFile?: File) {
  try {
    const docRef = doc(db, 'announcements', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    if (attachmentFile) {
        // Delete old file if it exists
        const currentDoc = await getAnnouncement(id);
        if (currentDoc?.attachmentUrl) {
            try {
                await deleteObject(ref(storage, currentDoc.attachmentUrl));
            } catch (storageError: any) {
                 if (storageError.code !== 'storage/object-not-found') {
                     console.warn("Could not delete old attachment", storageError);
                }
            }
        }
        // Upload new file
        const attachmentRef = ref(storage, `announcements/${Date.now()}_${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        dataToUpdate.attachmentUrl = await getDownloadURL(attachmentRef);
        dataToUpdate.attachmentName = attachmentFile.name;
    }
    
    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/announcements');
    revalidatePath(`/panel/announcements/edit/${id}`);
  } catch (error) {
    console.error("Error updating announcement:", error);
    throw new Error(`Gagal memperbarui pengumuman: ${(error as Error).message}`);
  }
}

// Delete an announcement
export async function deleteAnnouncement(id: string) {
  try {
    const docToDelete = await getAnnouncement(id);
    await deleteDoc(doc(db, 'announcements', id));
     if (docToDelete?.attachmentUrl) {
        try {
            await deleteObject(ref(storage, docToDelete.attachmentUrl));
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("Could not delete attachment:", storageError);
             }
        }
    }
    revalidatePath('/panel/announcements');
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw new Error("Gagal menghapus pengumuman.");
  }
}
