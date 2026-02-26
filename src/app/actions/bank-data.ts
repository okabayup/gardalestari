'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
export type { DataBankEntry } from '@/lib/definitions';
import type { DataBankEntry } from '@/lib/definitions';


const dataBankCollection = collection(db, 'dataBank');

// === Public Functions for AI Tool ===

/**
 * Searches the data bank for relevant entries based on a query.
 * This is an improved version that is more scalable.
 * @param searchQuery The keywords or question to search for.
 * @returns A list of relevant data bank entries.
 */
export async function searchDataBank(searchQuery: string): Promise<Partial<DataBankEntry>[]> {
    // Firestore doesn't support native full-text search. A simple lowercase "contains"
    // search can be done by fetching recent documents and filtering in memory.
    // For true scalability, a third-party service like Algolia/Typesense is recommended.
    const q = query(
        dataBankCollection,
        orderBy('publishedDate', 'desc'),
        limit(50) // Fetch more recent documents to have a larger pool for searching
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }

    const allEntries: DataBankEntry[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataBankEntry));

    // Perform in-memory filtering
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const results = allEntries.filter(entry => {
        const searchableText = `${entry.title} ${entry.summary} ${entry.category} ${entry.source}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
    }).slice(0, 5); // Return top 5 matches

    // Return a partial object to keep the payload for the AI small
    return results.map(entry => ({
        id: entry.id,
        title: entry.title,
        summary: entry.summary,
        source: entry.source,
        publishedDate: entry.publishedDate,
    }));
}


// === Admin CRUD Functions ===

export async function getDataBankEntries(): Promise<DataBankEntry[]> {
  const q = query(dataBankCollection, orderBy('publishedDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataBankEntry));
}

export async function getDataBankEntry(id: string): Promise<DataBankEntry | null> {
    const docRef = doc(db, 'dataBank', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as DataBankEntry : null;
}

export async function createDataBankEntry(data: Omit<DataBankEntry, 'id' | 'createdAt'>) {
    await addDoc(dataBankCollection, {
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/panel/data-bank');
}

export async function updateDataBankEntry(id: string, data: Partial<Omit<DataBankEntry, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'dataBank', id);
    await updateDoc(docRef, data);
    revalidatePath('/panel/data-bank');
    revalidatePath(`/panel/data-bank/edit/${id}`);
}

export async function deleteDataBankEntry(id: string) {
    const docRef = doc(db, 'dataBank', id);
    await deleteDoc(docRef);
    revalidatePath('/panel/data-bank');
}
