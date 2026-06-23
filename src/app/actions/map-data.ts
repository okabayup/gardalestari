'use server';

import { revalidatePath } from 'next/cache';
import type { MapData } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, now } from '@/lib/db';

const COL = 'mapData';

export async function getMapData(): Promise<MapData[]> {
  try {
    return await getAll<MapData>(COL, {
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
  } catch (error) {
    console.error('Error getting map data:', error);
    throw new Error('Gagal memuat data peta.');
  }
}

export async function getMapDataItem(id: string): Promise<MapData | null> {
  try {
    return await getOne<MapData>(COL, id);
  } catch (error) {
    console.error('Error getting map data item:', error);
    throw new Error('Gagal mengambil item data peta.');
  }
}

export async function createMapData(data: Omit<MapData, 'id' | 'createdAt'>) {
  try {
    await create(COL, {
      ...data,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      budget: data.budget ? Number(data.budget) : 0,
      disbursed: data.disbursed ? Number(data.disbursed) : 0,
      createdAt: now(),
    });
    revalidatePath('/panel/map-data');
    revalidatePath('/map');
  } catch (error) {
    console.error('Error creating map data:', error);
    throw new Error('Gagal membuat data peta.');
  }
}

export async function updateMapData(id: string, data: Partial<Omit<MapData, 'id' | 'createdAt'>>) {
  try {
    const dataToUpdate: Record<string, unknown> = { ...data };
    if (data.latitude) dataToUpdate.latitude = Number(data.latitude);
    if (data.longitude) dataToUpdate.longitude = Number(data.longitude);
    if (data.budget) dataToUpdate.budget = Number(data.budget);
    if (data.disbursed) dataToUpdate.disbursed = Number(data.disbursed);
    await update(COL, id, dataToUpdate);
    revalidatePath('/panel/map-data');
    revalidatePath('/map');
  } catch (error) {
    console.error('Error updating map data:', error);
    throw new Error('Gagal memperbarui data peta.');
  }
}

export async function deleteMapData(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/map-data');
    revalidatePath('/map');
  } catch (error) {
    console.error('Error deleting map data:', error);
    throw new Error('Gagal menghapus data peta.');
  }
}
