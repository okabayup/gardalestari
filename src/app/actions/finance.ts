

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
  setDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Account, JournalEntry, JournalTransaction, FinancialReportData, Budget } from '@/lib/definitions';
import { format, getMonth, getYear } from 'date-fns';

const accountsCollection = collection(db, 'accounts');
const journalEntriesCollection = collection(db, 'journalEntries');
const budgetsCollection = collection(db, 'budgets');


// --- Budget Management ---

/**
 * Fetches all budget entries for a specific period (YYYY-MM).
 * @param period - The period string, e.g., "2024-08".
 * @returns A promise that resolves to an array of Budget objects.
 */
export async function getBudgetsForPeriod(period: string): Promise<Budget[]> {
    try {
        const q = query(budgetsCollection, where('period', '==', period));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
    } catch (error) {
        console.error("[getBudgetsForPeriod Error]", error);
        throw new Error("Gagal mengambil data anggaran.");
    }
}

/**
 * Saves or updates multiple budget entries for a specific period.
 * @param period - The period string, e.g., "2024-08".
 * @param budgets - An array of budget data to save.
 */
export async function saveBudgets(period: string, budgets: { accountId: string, accountName: string, amount: number }[]) {
    try {
        const batch = writeBatch(db);
        
        for (const budget of budgets) {
            // Use a composite ID to ensure one budget per account per period
            const docId = `${period}_${budget.accountId}`;
            const docRef = doc(db, 'budgets', docId);

            batch.set(docRef, {
                period: period,
                accountId: budget.accountId,
                accountName: budget.accountName,
                amount: budget.amount,
                createdAt: serverTimestamp(),
            }, { merge: true });
        }
        
        await batch.commit();
        revalidatePath('/panel/finance/budgets');
        revalidatePath('/panel/finance/reports');
    } catch (error) {
        console.error("[saveBudgets Error]", error);
        throw new Error("Gagal menyimpan data anggaran.");
    }
}


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
    revalidatePath('/panel/finance/reports');
    revalidatePath('/panel/finance/dashboard');
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
    
    // Fetch budgets for the period
    const periods = new Set<string>();
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        periods.add(format(d, 'yyyy-MM'));
    }
    const budgetPromises = Array.from(periods).map(p => getBudgetsForPeriod(p));
    const budgetResults = await Promise.all(budgetPromises);
    const allBudgets = budgetResults.flat();
    const budgetMap = new Map(allBudgets.map(b => [b.accountId, (budgetMap.get(b.accountId) || 0) + b.amount]));


    const cashAccount = accounts.find(a => a.name.toLowerCase().includes('kas'));
    const cashPosition = cashAccount?.balance || 0;

    const q = query(
      journalEntriesCollection,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    const journalSnapshot = await getDocs(q);

    const report: FinancialReportData = {
      incomeStatement: { revenues: [], expenses: [], netIncome: 0, revenueTrend: [], expenseTrend: [] },
      balanceSheet: { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesAndEquity: 0 },
      cashPosition,
    };
    
    const dailyAggregates: Record<string, { revenue: number; expense: number }> = {};

    journalSnapshot.docs.forEach(doc => {
      const entry = doc.data() as JournalEntry;
      const dateStr = format(entry.date.toDate(), 'yyyy-MM-dd');
      
      if (!dailyAggregates[dateStr]) {
        dailyAggregates[dateStr] = { revenue: 0, expense: 0 };
      }

      entry.transactions.forEach(t => {
        const acc = accountsMap.get(t.accountId)!;
        if (!acc) return;

        if (acc.category === 'Pendapatan') {
          dailyAggregates[dateStr].revenue += t.credit - t.debit;
        } else if (acc.category === 'Beban') {
          dailyAggregates[dateStr].expense += t.debit - t.credit;
        }
      });
    });

    const sortedDates = Object.keys(dailyAggregates).sort();
    report.incomeStatement.revenueTrend = sortedDates.map(date => ({ date, Pendapatan: dailyAggregates[date].revenue }));
    report.incomeStatement.expenseTrend = sortedDates.map(date => ({ date, Beban: dailyAggregates[date].expense }));

    const incomeStatementAccountIds = accounts.filter(a => a.category === 'Pendapatan' || a.category === 'Beban').map(a => a.id!);
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
    
    accounts.forEach(acc => {
      if (acc.category === 'Pendapatan' || acc.category === 'Beban') {
        const total = accountPeriodChanges.get(acc.id!) || 0;
        if (total !== 0) {
            const item = { name: acc.name, total, budget: budgetMap.get(acc.id!) || 0 };
            if (acc.category === 'Pendapatan') report.incomeStatement.revenues.push(item);
            else report.incomeStatement.expenses.push(item);
        }
      } else if (acc.balance !== 0) {
          const item = { name: acc.name, balance: acc.balance };
          if (acc.category === 'Aset') report.balanceSheet.assets.push(item);
          else if (acc.category === 'Liabilitas') report.balanceSheet.liabilities.push(item);
          else if (acc.category === 'Ekuitas') report.balanceSheet.equity.push(item);
      }
    });

    const totalRevenue = report.incomeStatement.revenues.reduce((sum, item) => sum + item.total, 0);
    const totalExpense = report.incomeStatement.expenses.reduce((sum, item) => sum + item.total, 0);
    report.incomeStatement.netIncome = totalRevenue - totalExpense;
    
    report.balanceSheet.equity.push({ name: 'Laba (Rugi) Periode Ini', balance: report.incomeStatement.netIncome });

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

    
