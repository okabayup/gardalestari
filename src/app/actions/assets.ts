'use server';

import { revalidatePath } from 'next/cache';
import type { FixedAsset } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, now } from '@/lib/db';
import { createJournalEntry } from './finance';

const COL = 'fixedAssets';

export async function getAssets(): Promise<FixedAsset[]> {
  try {
    return await getAll<FixedAsset>(COL, {
      orderBy: { field: 'acquisitionDate', direction: 'desc' },
    });
  } catch (error) {
    console.error('[getAssets Error]', error);
    throw new Error('Gagal mengambil data aset tetap.');
  }
}

export async function createAsset(data: Omit<FixedAsset, 'id' | 'createdAt' | 'status'>) {
  try {
    await create(COL, { ...data, status: 'active', createdAt: now() });
    revalidatePath('/panel/finance/assets');
  } catch (error) {
    console.error('[createAsset Error]', error);
    throw new Error(`Gagal membuat aset: ${(error as Error).message}`);
  }
}

export async function updateAsset(id: string, data: Partial<Omit<FixedAsset, 'id' | 'createdAt'>>) {
  try {
    await update(COL, id, data as Record<string, unknown>);
    revalidatePath('/panel/finance/assets');
  } catch (error) {
    console.error('[updateAsset Error]', error);
    throw new Error(`Gagal memperbarui aset: ${(error as Error).message}`);
  }
}

export async function deleteAsset(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/finance/assets');
  } catch (error) {
    console.error('[deleteAsset Error]', error);
    throw new Error('Gagal menghapus aset.');
  }
}

export async function runMonthlyDepreciation(userId: string) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const activeAssets = await getAll<FixedAsset>(COL, {
    where: { field: 'status', op: '==', value: 'active' },
  });

  if (activeAssets.length === 0) {
    return { message: 'Tidak ada aset aktif untuk disusutkan.' };
  }

  let journalEntriesCreated = 0;

  for (const asset of activeAssets) {
    const lastDepreciation = (asset as any).lastDepreciationDate
      ? new Date((asset as any).lastDepreciationDate)
      : null;

    if (
      lastDepreciation &&
      lastDepreciation.getFullYear() === currentYear &&
      lastDepreciation.getMonth() === currentMonth
    ) {
      continue;
    }

    const monthlyDepreciation =
      ((asset as any).acquisitionCost - (asset as any).salvageValue) /
      ((asset as any).usefulLife * 12);

    if (monthlyDepreciation > 0) {
      await createJournalEntry({
        date: now() as any,
        description: `Penyusutan bulanan untuk ${asset.name}`,
        transactions: [
          { accountId: 'Beban Penyusutan', debit: monthlyDepreciation, credit: 0 },
          { accountId: 'Akumulasi Penyusutan Aset', debit: 0, credit: monthlyDepreciation },
        ],
        createdBy: userId,
      });

      await update(COL, asset.id!, { lastDepreciationDate: now() });
      journalEntriesCreated++;
    }
  }

  revalidatePath('/panel/finance/journal');
  revalidatePath('/panel/finance/assets');
  revalidatePath('/panel/finance/reports');
  revalidatePath('/panel/finance/dashboard');

  return { message: `Penyusutan selesai. ${journalEntriesCreated} entri jurnal dibuat.` };
}
