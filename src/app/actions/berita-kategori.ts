'use server';

import { revalidatePath } from 'next/cache';
import type { BeritaCategory } from '@/lib/definitions';
import { getAll, create, remove } from '@/lib/db';

const COL = 'beritaCategories';

export async function getBeritaCategories(): Promise<BeritaCategory[]> {
  const categories = await getAll<BeritaCategory>(COL, {
    orderBy: { field: 'name', direction: 'asc' },
  });
  return categories;
}

export async function addBeritaCategory(name: string) {
  try {
    await create(COL, { name });
    revalidatePath('/panel/berita/kategori');
  } catch (error) {
    console.error('Error adding category:', error);
    throw new Error('Gagal menambahkan kategori baru.');
  }
}

export async function deleteBeritaCategory(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/berita/kategori');
  } catch (error) {
    console.error('Error deleting category:', error);
    throw new Error('Gagal menghapus kategori.');
  }
}
