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

export interface DataBankEntry {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: 'Kebijakan' | 'Data Sektoral' | 'Riset' | 'Lainnya';
  source: string; // e.g., "Kementerian Pertanian", "BPS", "Penelitian Internal"
  publishedDate: Timestamp;
  createdAt: Timestamp;
}

const dataBankCollection = collection(db, 'dataBank');

// === Public Functions for AI Tool ===

/**
 * Searches the data bank for relevant entries based on a query.
 * To be used by an AI tool.
 * @param searchQuery The keywords or question to search for.
 * @returns A list of relevant data bank entries.
 */
export async function searchDataBank(searchQuery: string): Promise<Partial<DataBankEntry>[]> {
    const q = query(
        dataBankCollection,
        // Firestore doesn't support full-text search. A more robust solution would use
        // a third-party search service like Algolia or Typesense.
        // For now, we fetch all and filter in-memory which is not scalable.
        orderBy('publishedDate', 'desc'),
        limit(20) // Limit to recent 20 to avoid pulling too much data
    );

    const snapshot = await getDocs(q);
    const allEntries: DataBankEntry[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataBankEntry));

    const searchTerms = searchQuery.toLowerCase().split(' ');
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
