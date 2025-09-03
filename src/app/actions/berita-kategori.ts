
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface BeritaCategory {
    id?: string;
    name: string;
}

const categoriesCollection = collection(db, 'beritaCategories');

// Get all categories, ordered by name
export async function getBeritaCategories(): Promise<BeritaCategory[]> {
    const q = query(categoriesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const categories: BeritaCategory[] = [];
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, name: doc.data().name });
    });
    return categories;
}

// Add a new category
export async function addBeritaCategory(name: string) {
    try {
        await addDoc(categoriesCollection, { name });
        revalidatePath('/panel/berita/kategori');
    } catch (error) {
        console.error("Error adding category:", error);
        throw new Error("Gagal menambahkan kategori baru.");
    }
}

// Delete a category
export async function deleteBeritaCategory(id: string) {
    try {
        const categoryDoc = doc(db, 'beritaCategories', id);
        await deleteDoc(categoryDoc);
        revalidatePath('/panel/berita/kategori');
    } catch (error) {
        console.error("Error deleting category:", error);
        throw new Error("Gagal menghapus kategori.");
    }
}
