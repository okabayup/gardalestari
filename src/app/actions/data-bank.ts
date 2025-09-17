
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
    try {
        const q = query(
            dataBankCollection,
            orderBy('publishedDate', 'desc'),
            limit(50) 
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        const allEntries: DataBankEntry[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataBankEntry));

        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const results = allEntries.filter(entry => {
            const searchableText = `${entry.title} ${entry.summary} ${entry.category} ${entry.source}`.toLowerCase();
            return searchTerms.some(term => searchableText.includes(term));
        }).slice(0, 5); 

        return results.map(entry => ({
            id: entry.id,
            title: entry.title,
            summary: entry.summary,
            source: entry.source,
            publishedDate: entry.publishedDate,
        }));
    } catch (error) {
        console.error("[searchDataBank Error]", error);
        throw new Error("Gagal mencari di bank data.");
    }
}


// === Admin CRUD Functions ===

export async function getDataBankEntries(): Promise<DataBankEntry[]> {
  try {
    const q = query(dataBankCollection, orderBy('publishedDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataBankEntry));
  } catch (error) {
    console.error("[getDataBankEntries Error]", error);
    throw new Error("Gagal mengambil entri bank data.");
  }
}

export async function getDataBankEntry(id: string): Promise<DataBankEntry | null> {
    try {
        const docRef = doc(db, 'dataBank', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as DataBankEntry : null;
    } catch (error) {
        console.error("[getDataBankEntry Error]", error);
        throw new Error("Gagal mengambil entri bank data.");
    }
}

export async function createDataBankEntry(data: Omit<DataBankEntry, 'id' | 'createdAt'>) {
    try {
        await addDoc(dataBankCollection, {
            ...data,
            createdAt: Timestamp.now(),
        });
        revalidatePath('/panel/data-bank');
    } catch (error) {
        console.error("[createDataBankEntry Error]", error);
        throw new Error("Gagal membuat entri bank data.");
    }
}

export async function updateDataBankEntry(id: string, data: Partial<Omit<DataBankEntry, 'id' | 'createdAt'>>) {
    try {
        const docRef = doc(db, 'dataBank', id);
        await updateDoc(docRef, data);
        revalidatePath('/panel/data-bank');
        revalidatePath(`/panel/data-bank/edit/${id}`);
    } catch (error) {
        console.error("[updateDataBankEntry Error]", error);
        throw new Error("Gagal memperbarui entri bank data.");
    }
}

export async function deleteDataBankEntry(id: string) {
    try {
        const docRef = doc(db, 'dataBank', id);
        await deleteDoc(docRef);
        revalidatePath('/panel/data-bank');
    } catch (error) {
        console.error("[deleteDataBankEntry Error]", error);
        throw new Error("Gagal menghapus entri bank data.");
    }
}
