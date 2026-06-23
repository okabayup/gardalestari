'use server';

import { revalidatePath } from 'next/cache';
import type { MapDataset } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, now } from '@/lib/db';

const COL = 'mapDatasets';

export async function getMapDatasets(): Promise<MapDataset[]> {
  try {
    return await getAll<MapDataset>(COL, {
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
  } catch (error) {
    console.error('Error getting map datasets:', error);
    throw new Error('Gagal memuat dataset peta.');
  }
}

export async function getMapDataset(id: string): Promise<MapDataset | null> {
  try {
    return await getOne<MapDataset>(COL, id);
  } catch (error) {
    console.error('Error getting map dataset item:', error);
    throw new Error('Gagal mengambil item dataset peta.');
  }
}

export async function createMapDataset(data: Omit<MapDataset, 'id' | 'createdAt'>) {
  try {
    await create(COL, { ...data, createdAt: now() });
    revalidatePath('/panel/map-datasets');
    revalidatePath('/map');
  } catch (error) {
    console.error('Error creating map dataset:', error);
    throw new Error('Gagal membuat dataset peta.');
  }
}

export async function updateMapDataset(id: string, data: Partial<Omit<MapDataset, 'id' | 'createdAt'>>) {
  try {
    await update(COL, id, data as Record<string, unknown>);
    revalidatePath('/panel/map-datasets');
    revalidatePath('/map');
  } catch (error) {
    console.error('Error updating map dataset:', error);
    throw new Error('Gagal memperbarui dataset peta.');
  }
}

export async function deleteMapDataset(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/map-datasets');
    revalidatePath('/map');
  } catch (error) {
    console.error('Error deleting map dataset:', error);
    throw new Error('Gagal menghapus dataset peta.');
  }
}
