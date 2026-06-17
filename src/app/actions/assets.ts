
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
  serverTimestamp,
  writeBatch,
  Timestamp,
  where,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { FixedAsset } from '@/lib/definitions';
import { createJournalEntry } from './finance';

const assetsCollection = collection(db, 'fixedAssets');

export async function getAssets(): Promise<FixedAsset[]> {
  try {
    const q = query(assetsCollection, orderBy('acquisitionDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FixedAsset));
  } catch (error) {
    console.error("[getAssets Error]", error);
    throw new Error("Gagal mengambil data aset tetap.");
  }
}

export async function createAsset(data: Omit<FixedAsset, 'id' | 'createdAt' | 'status'>) {
  try {
    const assetData = {
      ...data,
      status: 'active' as const,
      createdAt: serverTimestamp(),
    };
    await addDoc(assetsCollection, assetData);
    revalidatePath('/panel/finance/assets');
  } catch (error) {
    console.error("[createAsset Error]", error);
    throw new Error(`Gagal membuat aset: ${(error as Error).message}`);
  }
}

export async function updateAsset(id: string, data: Partial<Omit<FixedAsset, 'id' | 'createdAt'>>) {
  try {
    const docRef = doc(db, 'fixedAssets', id);
    await updateDoc(docRef, data);
    revalidatePath('/panel/finance/assets');
  } catch (error) {
    console.error("[updateAsset Error]", error);
    throw new Error(`Gagal memperbarui aset: ${(error as Error).message}`);
  }
}

export async function deleteAsset(id: string) {
    try {
        const docRef = doc(db, 'fixedAssets', id);
        // Add check if asset has been depreciated before deleting
        await deleteDoc(docRef);
        revalidatePath('/panel/finance/assets');
    } catch (error) {
        console.error("[deleteAsset Error]", error);
        throw new Error("Gagal menghapus aset.");
    }
}

export async function runMonthlyDepreciation(userId: string) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const q = query(
        assetsCollection, 
        where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return { message: "Tidak ada aset aktif untuk disusutkan." };
    }

    let journalEntriesCreated = 0;

    for (const assetDoc of snapshot.docs) {
        const asset = { id: assetDoc.id, ...assetDoc.data() } as FixedAsset;
        const lastDepreciation = asset.lastDepreciationDate?.toDate();

        if (lastDepreciation && lastDepreciation.getFullYear() === currentYear && lastDepreciation.getMonth() === currentMonth) {
            continue; // Already depreciated this month
        }
        
        const monthlyDepreciation = (asset.acquisitionCost - asset.salvageValue) / (asset.usefulLife * 12);
        
        if (monthlyDepreciation > 0) {
             // This automatically creates a journal entry AND updates account balances in a transaction
            await createJournalEntry({
                date: Timestamp.now(),
                description: `Penyusutan bulanan untuk ${asset.name}`,
                transactions: [
                    // IMPORTANT: The accountId here should match the ID of the actual account in your CoA
                    { accountId: 'Beban Penyusutan', debit: monthlyDepreciation, credit: 0 }, 
                    { accountId: 'Akumulasi Penyusutan Aset', debit: 0, credit: monthlyDepreciation }, 
                ],
                createdBy: userId,
            });
            
            const assetRef = doc(db, 'fixedAssets', asset.id!);
            await updateDoc(assetRef, { lastDepreciationDate: Timestamp.now() });

            journalEntriesCreated++;
        }
    }

    revalidatePath('/panel/finance/journal');
    revalidatePath('/panel/finance/assets');
    revalidatePath('/panel/finance/reports');
    revalidatePath('/panel/finance/dashboard');
    
    return { message: `Penyusutan selesai. ${journalEntriesCreated} entri jurnal dibuat.` };
}
