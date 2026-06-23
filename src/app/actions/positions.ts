'use server';

import { revalidatePath } from 'next/cache';
import type { Position } from '@/lib/definitions';
import { getAll, create, update, remove } from '@/lib/db';

const COL = 'positions';

export async function getPositions(): Promise<Position[]> {
  try {
    return await getAll<Position>(COL, {
      orderBy: { field: 'name', direction: 'asc' },
    });
  } catch (error) {
    console.error('[getPositions Error]', error);
    throw new Error('Gagal memuat data jabatan.');
  }
}

export async function createPosition(data: Omit<Position, 'id'>) {
  try {
    await create(COL, data as Record<string, unknown>);
    revalidatePath('/panel/positions');
  } catch (error) {
    console.error('[createPosition Error]', error);
    throw new Error('Gagal menambahkan jabatan baru.');
  }
}

export async function updatePosition(id: string, data: Partial<Position>) {
  try {
    await update(COL, id, data as Record<string, unknown>);
    revalidatePath('/panel/positions');
  } catch (error) {
    console.error('[updatePosition Error]', error);
    throw new Error('Gagal memperbarui jabatan.');
  }
}

export async function deletePosition(id: string) {
  try {
    // TODO: Check if any user has this position before deleting
    await remove(COL, id);
    revalidatePath('/panel/positions');
  } catch (error) {
    console.error('[deletePosition Error]', error);
    throw new Error('Gagal menghapus jabatan.');
  }
}
