
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
import { format, getMonth, getYear } from 'date-fns';

const accountsCollection = collection(db, 'accounts');
const journalEntriesCollection = collection(db, 'journalEntries');
const budgetsCollection = collection(db, 'budgets');
const contactsCollection = collection(db, 'contacts');
const invoicesCollection = collection(db, 'invoices');


// --- Invoicing (AR) Management ---
export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>, userId: string) {
    try {
        const invoiceNumber = `INV-${Date.now()}`;

        // This will create the invoice and the corresponding journal entry in a single atomic operation.
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
                    // Piutang Usaha (AR) di Debit sebesar Total Tagihan
                    { accountId: 'Piutang Usaha', debit: data.total, credit: 0 }, 
                    // Pendapatan di Kredit sebesar Subtotal (sebelum pajak)
                    { accountId: 'Pendapatan Jasa', debit: 0, credit: data.subtotal },
                    // Utang PPN di Kredit sebesar Pajak yang dipungut
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


// --- Contact Management ---
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


// --- Budget Management ---
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


// --- Chart of Accounts (CoA) Management ---
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

// --- Simplified Transaction Entry ---
export async function createSimpleTransaction(
    type: 'income' | 'expense',
    date: Timestamp,
    amount: number,
    description: string,
    cashBankAccountId: string, // The 'from' or 'to' account (must be an asset)
    categoryAccountId: string, // The 'for' or 'source' account (expense or income)
    userId: string
) {
    let debitAccount, creditAccount;

    if (type === 'expense') {
        // Expense: Debit the expense account, Credit the cash/bank account
        debitAccount = categoryAccountId;
        creditAccount = cashBankAccountId;
    } else { // income
        // Income: Debit the cash/bank account, Credit the income account
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


// --- General Journal Management ---
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
    } else { // Kredit
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
                // Convert Timestamp to ISO string
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
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
        
        // This is a client-side filter because Firestore can't query inside array of objects precisely for this case.
        const filteredEntries = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                };
            })
            .filter(entry => entry.transactions.some((t: any) => t.accountId === accountId));

        return filteredEntries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
        console.error("[getJournalEntriesForAccount Error]", error);
        throw new Error("Gagal mengambil data buku besar.");
    }
}


// --- Fixed Assets ---
// ... (omitted similar changes for brevity but same pattern applies)
