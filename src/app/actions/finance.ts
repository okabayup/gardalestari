
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
  where,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Account, JournalEntry, JournalTransaction, FinancialReportData } from '@/lib/definitions';

const accountsCollection = collection(db, 'accounts');
const journalEntriesCollection = collection(db, 'journalEntries');

// --- Chart of Accounts (CoA) Management ---

/**
 * Fetches a single account's details.
 * @param accountId - The ID of the account.
 * @returns A promise that resolves to the Account object or null.
 */
export async function getAccountDetails(accountId: string): Promise<Account | null> {
  try {
    const docRef = doc(db, 'accounts', accountId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Account;
    }
    return null;
  } catch (error) {
    console.error("[getAccountDetails Error]", error);
    throw new Error("Gagal mengambil detail akun.");
  }
}


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

/**
 * Fetches all journal entries for a specific account.
 * @param accountId - The ID of the account.
 * @returns A promise that resolves to an array of JournalEntry objects.
 */
export async function getJournalEntriesForAccount(accountId: string): Promise<JournalEntry[]> {
    try {
        const q = query(
            journalEntriesCollection,
            where('transactions', 'array-contains-any', [{ accountId: accountId, debit: 0, credit: 0 }]), // This is a trick to query array of objects
            orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);

        // Firestore's array-contains-any is not perfect for this, so we need to filter in-memory
        const filteredEntries = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry))
            .filter(entry => entry.transactions.some(t => t.accountId === accountId));

        return filteredEntries;
    } catch (error) {
        console.error("[getJournalEntriesForAccount Error]", error);
        throw new Error("Gagal mengambil data buku besar.");
    }
}


// --- Financial Reports ---
export async function getFinancialReports(startDate: Date, endDate: Date): Promise<FinancialReportData> {
  try {
    const accounts = await getAccounts();
    const accountsMap = new Map(accounts.map(acc => [acc.id!, acc]));

    // --- Income Statement Calculation ---
    const incomeStatementAccounts = accounts.filter(a => a.category === 'Pendapatan' || a.category === 'Beban');
    const incomeStatementAccountIds = incomeStatementAccounts.map(a => a.id!);

    const q = query(
      journalEntriesCollection,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    const journalSnapshot = await getDocs(q);

    const report: FinancialReportData = {
      incomeStatement: { revenues: [], expenses: [], netIncome: 0 },
      balanceSheet: { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesAndEquity: 0 },
    };

    const accountPeriodChanges = new Map<string, number>();

    journalSnapshot.docs.forEach(doc => {
      const entry = doc.data() as JournalEntry;
      entry.transactions.forEach(t => {
        if (incomeStatementAccountIds.includes(t.accountId)) {
          const acc = accountsMap.get(t.accountId)!;
          const currentChange = accountPeriodChanges.get(t.accountId) || 0;
          const change = acc.normalBalance === 'Kredit' ? t.credit - t.debit : t.debit - t.credit;
          accountPeriodChanges.set(t.accountId, currentChange + change);
        }
      });
    });

    incomeStatementAccounts.forEach(acc => {
      const total = accountPeriodChanges.get(acc.id!) || 0;
      if (total === 0) return;
      
      const item = { name: acc.name, total };
      if (acc.category === 'Pendapatan') {
        report.incomeStatement.revenues.push(item);
      } else {
        report.incomeStatement.expenses.push(item);
      }
    });

    const totalRevenue = report.incomeStatement.revenues.reduce((sum, item) => sum + item.total, 0);
    const totalExpense = report.incomeStatement.expenses.reduce((sum, item) => sum + item.total, 0);
    report.incomeStatement.netIncome = totalRevenue - totalExpense;


    // --- Balance Sheet Calculation ---
    // This is a simplified calculation. A correct one requires calculating balances from the beginning of time up to the endDate.
    // For this MVP, we will use the pre-calculated balance on the account documents. A more robust system would re-calculate.
    accounts.forEach(acc => {
      if (acc.balance !== 0) {
        if (acc.category === 'Aset') {
          report.balanceSheet.assets.push({ name: acc.name, balance: acc.balance });
        } else if (acc.category === 'Liabilitas') {
          report.balanceSheet.liabilities.push({ name: acc.name, balance: acc.balance });
        } else if (acc.category === 'Ekuitas') {
          // Add Net Income to Equity
           report.balanceSheet.equity.push({ name: acc.name, balance: acc.balance });
        }
      }
    });
    
    // Add net income as retained earnings to equity section
    report.balanceSheet.equity.push({ name: 'Laba Ditahan (Periode Ini)', balance: report.incomeStatement.netIncome });

    report.balanceSheet.totalAssets = report.balanceSheet.assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = report.balanceSheet.liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = report.balanceSheet.equity.reduce((sum, item) => sum + item.balance, 0);
    report.balanceSheet.totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return report;

  } catch (error) {
    console.error('[getFinancialReports Error]', error);
    throw new Error('Gagal menghasilkan laporan keuangan.');
  }
}
