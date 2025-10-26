
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, increment, where, writeBatch, limit } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { ShortLink } from '@/lib/definitions';

const shortlinksCollection = collection(db, 'shortlinks');

/**
 * Creates a new shortlink in the gamules.io service.
 * @param data - The details of the shortlink to create.
 * @returns The ID of the newly created shortlink.
 */
export async function createShortLink(data: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>): Promise<string> {
    try {
        const q = query(shortlinksCollection, where('slug', '==', data.slug));
        const existing = await getDocs(q);
        if (!existing.empty) {
            throw new Error(`Shortlink dengan slug "${data.slug}" sudah ada.`);
        }

        const docRef = await addDoc(shortlinksCollection, {
            ...data,
            clicks: 0,
            createdAt: serverTimestamp(),
        });

        revalidatePath('/panel/shortlinks');
        return docRef.id;
    } catch (error) {
        console.error("Error creating shortlink:", error);
        throw new Error(`Gagal membuat shortlink: ${(error as Error).message}`);
    }
}

export async function updateShortLink(id: string, data: Partial<Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>>) {
    try {
        if (data.slug) {
            const q = query(shortlinksCollection, where('slug', '==', data.slug));
            const existing = await getDocs(q);
            if (!existing.empty && existing.docs[0].id !== id) {
                 throw new Error(`Shortlink dengan slug "${data.slug}" sudah ada.`);
            }
        }
        const docRef = doc(db, 'shortlinks', id);
        await updateDoc(docRef, data);
        revalidatePath('/panel/shortlinks');

    } catch (error) {
         console.error("Error updating shortlink:", error);
        throw new Error(`Gagal memperbarui shortlink: ${(error as Error).message}`);
    }
}


export async function getShortLinks(): Promise<ShortLink[]> {
    const q = query(shortlinksCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortLink));
}

export async function getShortLink(slug: string): Promise<ShortLink | null> {
    try {
        const q = query(shortlinksCollection, where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as ShortLink;

    } catch (error) {
        console.error(`Error getting shortlink for slug ${slug}:`, error);
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

export async function incrementClickCount(slug: string): Promise<void> {
    try {
        const q = query(shortlinksCollection, where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await updateDoc(docRef, {
                clicks: increment(1)
            });
        }
    } catch (error) {
        // Log this error but don't throw, as the redirect is more important.
        console.error(`Failed to increment click count for ${slug}:`, error);
    }
}
