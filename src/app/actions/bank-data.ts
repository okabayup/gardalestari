'use server';

import { revalidatePath } from 'next/cache';
export type { DataBankEntry } from '@/lib/definitions';
import type { DataBankEntry } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, now } from '@/lib/db';

const COL = 'dataBank';

export async function searchDataBank(searchQuery: string): Promise<Partial<DataBankEntry>[]> {
  try {
    const all = await getAll<DataBankEntry>(COL, {
      orderBy: { field: 'publishedDate', direction: 'desc' },
      limit: 50,
    });
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter(e => {
        const text = `${e.title} ${(e as any).summary} ${(e as any).category} ${(e as any).source}`.toLowerCase();
        return terms.some(t => text.includes(t));
      })
      .slice(0, 5)
      .map(({ id, title, summary, source, publishedDate }: any) => ({ id, title, summary, source, publishedDate }));
  } catch (error) {
    console.error('[searchDataBank Error]', error);
    throw new Error('Gagal mencari di bank data.');
  }
}

export async function getDataBankEntries(): Promise<DataBankEntry[]> {
  try {
    return await getAll<DataBankEntry>(COL, {
      orderBy: { field: 'publishedDate', direction: 'desc' },
    });
  } catch (error) {
    console.error('[getDataBankEntries Error]', error);
    throw new Error('Gagal mengambil entri bank data.');
  }
}

export async function getDataBankEntry(id: string): Promise<DataBankEntry | null> {
  try {
    return await getOne<DataBankEntry>(COL, id);
  } catch (error) {
    console.error('[getDataBankEntry Error]', error);
    throw new Error('Gagal mengambil entri bank data.');
  }
}

export async function createDataBankEntry(data: Omit<DataBankEntry, 'id' | 'createdAt'>) {
  try {
    await create(COL, { ...data, createdAt: now() });
    revalidatePath('/panel/data-bank');
  } catch (error) {
    console.error('[createDataBankEntry Error]', error);
    throw new Error('Gagal membuat entri bank data.');
  }
}

export async function updateDataBankEntry(
  id: string,
  data: Partial<Omit<DataBankEntry, 'id' | 'createdAt'>>
) {
  try {
    await update(COL, id, data as Record<string, unknown>);
    revalidatePath('/panel/data-bank');
    revalidatePath(`/panel/data-bank/edit/${id}`);
  } catch (error) {
    console.error('[updateDataBankEntry Error]', error);
    throw new Error('Gagal memperbarui entri bank data.');
  }
}

export async function deleteDataBankEntry(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/data-bank');
  } catch (error) {
    console.error('[deleteDataBankEntry Error]', error);
    throw new Error('Gagal menghapus entri bank data.');
  }
}
