

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
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Account } from '@/lib/definitions';

const accountsCollection = collection(db, 'accounts');

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
