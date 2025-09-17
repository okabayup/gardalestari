
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { PermissionId, Position } from '@/lib/definitions';

const positionsCollection = collection(db, 'positions');

// Get all positions, ordered by name
export async function getPositions(): Promise<Position[]> {
    try {
        const q = query(positionsCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Position));
    } catch (error) {
        console.error("[getPositions Error]", error);
        throw new Error("Gagal memuat data jabatan.");
    }
}

// Add a new position
export async function createPosition(data: Omit<Position, 'id'>) {
    try {
        await addDoc(positionsCollection, data);
        revalidatePath('/panel/positions');
    } catch (error) {
        console.error("[createPosition Error]", error);
        throw new Error("Gagal menambahkan jabatan baru.");
    }
}

// Update an existing position
export async function updatePosition(id: string, data: Partial<Position>) {
    try {
        const positionDoc = doc(db, 'positions', id);
        await updateDoc(positionDoc, data);
        revalidatePath('/panel/positions');
    } catch (error) {
        console.error("[updatePosition Error]", error);
        throw new Error("Gagal memperbarui jabatan.");
    }
}


// Delete a position
export async function deletePosition(id: string) {
    try {
        // TODO: Check if any user has this position before deleting
        const positionDoc = doc(db, 'positions', id);
        await deleteDoc(positionDoc);
        revalidatePath('/panel/positions');
    } catch (error) {
        console.error("[deletePosition Error]", error);
        throw new Error("Gagal menghapus jabatan.");
    }
}
