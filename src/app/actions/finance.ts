
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
  limit,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Account, JournalEntry, JournalTransaction, FinancialReportData, Budget, Contact, Invoice } from '@/lib/definitions';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Internal constants (not exported to comply with Server Actions rules)
const accountsCollection = collection(db, 'accounts');
const journalEntriesCollection = collection(db, 'journalEntries');
const budgetsCollection = collection(db, 'budgets');
const contactsCollection = collection(db, 'contacts');
const invoicesCollection = collection(db, 'invoices');

/**
 * Generates a comprehensive financial report for a given date range.
 */
export async function getFinancialReports(startDate: Date, endDate: Date): Promise<FinancialReportData> {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const [accountsSnapshot, entriesSnapshot, budgets] = await Promise.all([
      getDocs(query(accountsCollection, orderBy('code', 'asc'))),
      getDocs(query(journalEntriesCollection, where('date', '>=', startTimestamp), where('date', '<=', endTimestamp), orderBy('date', 'asc'))),
      getBudgetsForPeriod(format(startDate, 'yyyy-MM'))
    ]);

    const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    const entries = entriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            date: data.date,
            createdAt: data.createdAt
        } as unknown as JournalEntry;
    });

    const revenues: Record<string, { name: string; total: number; budget?: number }> = {};
    const expenses: Record<string, { name: string; total: number; budget?: number }> = {};
    
    entries.forEach(entry => {
      entry.transactions.forEach(trans => {
        const account = accounts.find(a => a.id === trans.accountId);
        if (!account) return;

        if (account.category === 'Pendapatan') {
          if (!revenues[account.id!]) revenues[account.id!] = { name: account.name, total: 0 };
          revenues[account.id!].total += (trans.credit - trans.debit);
        } else if (account.category === 'Beban') {
          if (!expenses[account.id!]) {
              const budgetAmount = budgets.find(b => b.accountId === account.id)?.amount || 0;
              expenses[account.id!] = { name: account.name, total: 0, budget: budgetAmount };
          }
          expenses[account.id!].total += (trans.debit - trans.credit);
        }
      });
    });

    const revenueList = Object.values(revenues);
    const expenseList = Object.values(expenses);
    const totalRevenue = revenueList.reduce((sum, r) => sum + r.total, 0);
    const totalExpense = expenseList.reduce((sum, e) => sum + e.total, 0);
    const netIncome = totalRevenue - totalExpense;

    const revenueTrend: Record<string, number> = {};
    const expenseTrend: Record<string, number> = {};
    
    entries.forEach(entry => {
      const dateKey = format((entry.date as any).toDate(), 'yyyy-MM-dd');
      entry.transactions.forEach(trans => {
        const account = accounts.find(a => a.id === trans.accountId);
        if (!account) return;
        if (account.category === 'Pendapatan') {
          revenueTrend[dateKey] = (revenueTrend[dateKey] || 0) + (trans.credit - trans.debit);
        } else if (account.category === 'Beban') {
          expenseTrend[dateKey] = (expenseTrend[dateKey] || 0) + (trans.debit - trans.credit);
        }
      });
    });

    const assets = accounts.filter(a => a.category === 'Aset').map(a => ({ name: a.name, balance: a.balance }));
    const liabilities = accounts.filter(a => a.category === 'Liabilitas').map(a => ({ name: a.name, balance: a.balance }));
    const equity = accounts.filter(a => a.category === 'Ekuitas').map(a => ({ name: a.name, balance: a.balance }));
    
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    equity.push({ name: 'Laba (Rugi) Bersih Berjalan', balance: netIncome });

    return {
      incomeStatement: {
        revenues: revenueList,
        expenses: expenseList,
        netIncome,
        revenueTrend: Object.entries(revenueTrend).map(([date, val]) => ({ date, Pendapatan: val })),
        expenseTrend: Object.entries(expenseTrend).map(([date, val]) => ({ date, Beban: val })),
        expenseComposition: expenseList.map(e => ({ name: e.name, value: e.total })),
      },
      balanceSheet: {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilitiesAndEquity: totalAssets,
      },
      cashPosition: accounts.filter(a => a.category === 'Aset' && (a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank'))).reduce((sum, a) => sum + a.balance, 0),
    };
  } catch (error) {
    console.error("[getFinancialReports Error]", error);
    throw new Error("Gagal menghasilkan laporan keuangan.");
  }
}

export async function getInvoices(): Promise<Invoice[]> {
    try {
        const q = query(invoicesCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date,
                dueDate: data.dueDate,
                createdAt: data.createdAt,
            } as unknown as Invoice;
        });
    } catch (error) {
        console.error("[getInvoices Error]", error);
        return [];
    }
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>, userId: string) {
    try {
        const invoiceNumber = `INV-${Date.now()}`;

        await runTransaction(db, async (transaction) => {
            const newInvoiceRef = doc(invoicesCollection);
            
            const invoiceData = {
                ...data,
                invoiceNumber,
                status: 'draft' as const,
                createdAt: serverTimestamp(),
                createdBy: userId,
            };
            transaction.set(newInvoiceRef, invoiceData);

            const journalEntry: Omit<JournalEntry, 'id' | 'createdAt'> = {
                date: data.date,
                description: `Faktur Penjualan #${invoiceNumber} untuk ${data.contactName}`,
                transactions: [
                    { accountId: 'Piutang Usaha', debit: data.total, credit: 0 }, 
                    { accountId: 'Pendapatan Jasa', debit: 0, credit: data.subtotal },
                    { accountId: 'Utang PPN', debit: 0, credit: data.tax },
                ],
                createdBy: userId,
                relatedInvoiceId: newInvoiceRef.id,
            };
            
            await createJournalEntryWithTransaction(transaction, journalEntry);
        });

        revalidatePath('/panel/finance/invoices');
        revalidatePath('/panel/finance/journal');
        revalidatePath('/panel/finance/accounts');
        revalidatePath('/panel/finance/reports');
        revalidatePath('/panel/finance/dashboard');

    } catch (error) {
        console.error("[createInvoice Error]", error);
        throw new Error(`Gagal membuat faktur: ${(error as Error).message}`);
    }
}

export async function getContacts(): Promise<Contact[]> {
    const q = query(contactsCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}

export async function createContact(data: Omit<Contact, 'id' | 'createdAt'>) {
    await addDoc(contactsCollection, { ...data, createdAt: serverTimestamp() });
    revalidatePath('/panel/finance/contacts');
}

export async function updateContact(id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'contacts', id);
    await updateDoc(docRef, data);
    revalidatePath('/panel/finance/contacts');
}

export async function deleteContact(id: string) {
    const docRef = doc(db, 'contacts', id);
    await deleteDoc(docRef);
    revalidatePath('/panel/finance/contacts');
}

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

export async function saveBudgets(period: string, budgets: { accountId: string, accountName: string, amount: number }[]) {
    try {
        const batch = writeBatch(db);
        
        for (const budget of budgets) {
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

export async function getAccounts(): Promise<Account[]> {
  try {
    const q = query(accountsCollection, orderBy('code', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  } catch (error) {
    console.error("[getAccounts Error]", error);
    throw new Error("Gagal mengambil data Daftar Akun.");
  }
}

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

export async function deleteAccount(id: string) {
  try {
    const docRef = doc(db, 'accounts', id);
    await deleteDoc(docRef);
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[deleteAccount Error]", error);
    throw new Error(`Gagal menghapus akun: ${(error as Error).message}`);
  }
}

export async function createSimpleTransaction(
    type: 'income' | 'expense',
    date: Timestamp,
    amount: number,
    description: string,
    cashBankAccountId: string,
    categoryAccountId: string,
    userId: string
) {
    let debitAccount, creditAccount;

    if (type === 'expense') {
        debitAccount = categoryAccountId;
        creditAccount = cashBankAccountId;
    } else {
        debitAccount = cashBankAccountId;
        creditAccount = categoryAccountId;
    }
    
    const entry: Omit<JournalEntry, 'id' | 'createdAt'> = {
        date,
        description,
        transactions: [
            { accountId: debitAccount, debit: amount, credit: 0 },
            { accountId: creditAccount, debit: 0, credit: amount },
        ],
        createdBy: userId,
    };

    await createJournalEntry(entry);
}

async function createJournalEntryWithTransaction(transaction: any, data: Omit<JournalEntry, 'id' | 'createdAt'>) {
  const newEntryRef = doc(journalEntriesCollection);
  transaction.set(newEntryRef, { ...data, createdAt: serverTimestamp() });

  for (const trans of data.transactions) {
    const accountRef = doc(db, 'accounts', trans.accountId);
    const accountDoc = await transaction.get(accountRef);

    if (!accountDoc.exists()) {
        throw new Error(`Akun dengan ID "${trans.accountId}" tidak ditemukan.`);
    }
    const accountData = accountDoc.data() as Account;
    
    let amountChange = 0;
    if (accountData.normalBalance === 'Debit') {
        amountChange = trans.debit - trans.credit;
    } else {
        amountChange = trans.credit - trans.debit;
    }
    transaction.update(accountRef, { balance: increment(amountChange) });
  }
}

export async function createJournalEntry(data: Omit<JournalEntry, 'id' | 'createdAt'>) {
  try {
    await runTransaction(db, async (transaction) => {
        await createJournalEntryWithTransaction(transaction, data);
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

export async function getJournalEntries(): Promise<any[]> {
    try {
        const q = query(journalEntriesCollection, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date,
                createdAt: data.createdAt,
            };
        });
    } catch(error) {
        console.error("[getJournalEntries Error]", error);
        throw new Error("Gagal mengambil data Buku Jurnal.");
    }
}

export async function getJournalEntriesForAccount(accountId: string): Promise<any[]> {
    try {
        const q = query(collection(db, 'journalEntries'), where('transactions', 'array-contains-any', [{accountId, credit:0, debit:0}]));
        const snapshot = await getDocs(q);
        
        const filteredEntries = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date,
                };
            })
            .filter(entry => entry.transactions.some((t: any) => t.accountId === accountId));

        return filteredEntries.sort((a,b) => (a.date as any).toDate().getTime() - (b.date as any).toDate().getTime());
    } catch (error) {
        console.error("[getJournalEntriesForAccount Error]", error);
        throw new Error("Gagal mengambil data buku besar.");
    }
}
