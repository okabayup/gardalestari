

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
  runTransaction,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Account, JournalEntry, JournalTransaction } from '@/lib/definitions';

const accountsCollection = collection(db, 'accounts');
const journalEntriesCollection = collection(db, 'journalEntries');

// --- Chart of Accounts (CoA) Management ---

/**
 * Fetches all accounts from the Chart of Accounts, ordered by code.
 * @returns A promise that resolves to an array of Account objects.
 */
export async function getAccounts(): Promise<Account[]> {
  try {
    const q = query(accountsCollection, orderBy('code', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  } catch (error) {
    console.error("[getAccounts Error]", error);
    throw new Error("Gagal mengambil data Bagan Akun.");
  }
}

/**
 * Creates a new account in the Chart of Accounts.
 * @param data - The account data to create.
 */
export async function createAccount(data: Omit<Account, 'id' | 'createdAt' | 'balance'>) {
  try {
    const accountData = {
      ...data,
      balance: 0,
      createdAt: serverTimestamp(),
    };
    await addDoc(accountsCollection, accountData);
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[createAccount Error]", error);
    throw new Error(`Gagal membuat akun: ${(error as Error).message}`);
  }
}

/**
 * Updates an existing account.
 * @param id - The ID of the account to update.
 * @param data - The partial data to update.
 */
export async function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>) {
  try {
    const docRef = doc(db, 'accounts', id);
    await updateDoc(docRef, data);
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[updateAccount Error]", error);
    throw new Error(`Gagal memperbarui akun: ${(error as Error).message}`);
  }
}

/**
 * Deletes an account from the Chart of Accounts.
 * @param id - The ID of the account to delete.
 */
export async function deleteAccount(id: string) {
  try {
    const docRef = doc(db, 'accounts', id);
    // TODO: Add a check here to prevent deleting an account with a non-zero balance
    // or existing journal entries.
    await deleteDoc(docRef);
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[deleteAccount Error]", error);
    throw new Error(`Gagal menghapus akun: ${(error as Error).message}`);
  }
}


// --- General Journal Management ---

/**
 * Creates a new journal entry and updates account balances.
 * @param data - The journal entry data.
 */
export async function createJournalEntry(data: Omit<JournalEntry, 'id' | 'createdAt'>) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create the new journal entry document
      const newEntryRef = doc(journalEntriesCollection);
      transaction.set(newEntryRef, { ...data, createdAt: serverTimestamp() });

      // 2. Update balances for each account in the transaction
      for (const trans of data.transactions) {
        const accountRef = doc(db, 'accounts', trans.accountId);
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) {
          throw new Error(`Akun dengan ID ${trans.accountId} tidak ditemukan.`);
        }
        
        const accountData = accountDoc.data() as Account;
        let amountChange = 0;
        if (accountData.normalBalance === 'Debit') {
            amountChange = trans.debit - trans.credit;
        } else { // Kredit
            amountChange = trans.credit - trans.debit;
        }

        transaction.update(accountRef, { balance: increment(amountChange) });
      }
    });

    revalidatePath('/panel/finance/journal');
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[createJournalEntry Error]", error);
    throw new Error(`Gagal membuat entri jurnal: ${(error as Error).message}`);
  }
}

/**
 * Fetches all journal entries, ordered by date.
 * @returns A promise that resolves to an array of JournalEntry objects.
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
    try {
        const q = query(journalEntriesCollection, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
    } catch(error) {
        console.error("[getJournalEntries Error]", error);
        throw new Error("Gagal mengambil data Jurnal Umum.");
    }
}
