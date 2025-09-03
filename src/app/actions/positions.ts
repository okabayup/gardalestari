
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export const ALL_PERMISSIONS = [
    { id: 'manage_users', label: 'Kelola Anggota & Verifikasi' },
    { id: 'manage_news', label: 'Kelola Berita (Buat/Edit)' },
    { id: 'delete_news', label: 'Hapus Berita' },
    { id: 'manage_events', label: 'Kelola Acara (Buat/Edit)' },
    { id: 'delete_events', label: 'Hapus Acara' },
    { id: 'manage_programs', label: 'Kelola Program (Buat/Edit)' },
    { id: 'delete_programs', label: 'Hapus Program' },
    { id: 'manage_partners', label: 'Kelola Mitra (Buat/Edit)' },
    { id: 'delete_partners', label: 'Hapus Mitra' },
    { id: 'manage_forms', label: 'Kelola Formulir (Buat/Edit/Hapus)' },
    { id: 'send_notifications', label: 'Kirim Notifikasi' },
    { id: 'manage_landing_page', label: 'Kelola Halaman Utama' },
    { id: 'manage_settings', label: 'Kelola Pengaturan Aplikasi' },
    { id: 'manage_positions', label: 'Kelola Jabatan & Hak Akses' },
] as const;

export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

export interface Position {
  id?: string;
  name: string;
  permissions: PermissionId[];
}

const positionsCollection = collection(db, 'positions');

// Get all positions, ordered by name
export async function getPositions(): Promise<Position[]> {
    const q = query(positionsCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Position));
}

// Add a new position
export async function createPosition(data: Omit<Position, 'id'>) {
    try {
        await addDoc(positionsCollection, data);
        revalidatePath('/panel/positions');
    } catch (error) {
        console.error("Error adding position:", error);
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
        console.error("Error updating position:", error);
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
        console.error("Error deleting position:", error);
        throw new Error("Gagal menghapus jabatan.");
    }
}
