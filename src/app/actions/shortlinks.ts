
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { ShortLink } from '@/lib/definitions';

const shortlinksCollection = collection(db, 'shortlinks');
export const SHORTLINK_DOMAIN = 'https://gamules.io';

/**
 * Creates a new shortlink in the gamules.io service.
 * @param data - The details of the shortlink to create.
 * @returns The ID of the newly created shortlink.
 */
export async function createShortLink(data: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>): Promise<string> {
    try {
        const docRef = await addDoc(shortlinksCollection, {
            ...data,
            clicks: 0,
            createdAt: serverTimestamp(),
        });
        revalidatePath('/panel/shortlinks');
        return docRef.id;
    } catch (error) {
        console.error("Error creating shortlink:", error);
        throw new Error("Gagal membuat shortlink.");
    }
}

export async function getShortLinks(): Promise<ShortLink[]> {
    const q = query(shortlinksCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortLink));
}

export async function getShortLink(id: string): Promise<ShortLink | null> {
    try {
        const docRef = doc(db, 'shortlinks', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ShortLink : null;
    } catch (error) {
        console.error(`Error getting shortlink ${id}:`, error);
        return null; // Return null on error to prevent breaking redirects
    }
}

export async function deleteShortLink(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'shortlinks', id));
        revalidatePath('/panel/shortlinks');
    } catch (error) {
        console.error("Error deleting shortlink:", error);
        throw new Error("Gagal menghapus shortlink.");
    }
}

export async function incrementClickCount(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'shortlinks', id);
        await updateDoc(docRef, {
            clicks: increment(1)
        });
    } catch (error) {
        // Log this error but don't throw, as the redirect is more important.
        console.error(`Failed to increment click count for ${id}:`, error);
    }
}
