

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
                    { accountId: 'Piutang Usaha', debit: data.total, credit: 0 }, 
                    { accountId: 'Pendapatan Jasa', debit: 0, credit: data.subtotal },
                    // TODO: Add tax transaction if applicable, e.g., to 'Utang PPN'.
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

export async function getJournalEntries(): Promise<JournalEntry[]> {
    try {
        const q = query(journalEntriesCollection, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
    } catch(error) {
        console.error("[getJournalEntries Error]", error);
        throw new Error("Gagal mengambil data Buku Jurnal.");
    }
}

export async function getJournalEntriesForAccount(accountId: string, upToDate?: Date): Promise<{ entries: JournalEntry[], openingBalance: number }> {
    try {
        const accountDoc = await getAccountDetails(accountId);
        if (!accountDoc) throw new Error("Akun tidak ditemukan");

        const q = query(collection(db, 'journalEntries'), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);

        let openingBalance = 0;
        let runningBalance = 0;
        
        const relevantEntries: JournalEntry[] = [];
        
        snapshot.docs.forEach(doc => {
            const entry = { id: doc.id, ...doc.data() } as JournalEntry;
            const transaction = entry.transactions.find(t => t.accountId === accountId);

            if (transaction) {
                const change = accountDoc.normalBalance === 'Debit' 
                    ? transaction.debit - transaction.credit 
                    : transaction.credit - transaction.debit;
                
                if (upToDate && entry.date.toDate() < upToDate) {
                    openingBalance += change;
                } else {
                    runningBalance += change;
                    relevantEntries.push(entry);
                }
            }
        });
        
        // This calculation provides a different perspective on opening balance.
        // Let's refine it in the component for presentation.
        // For now, let's calculate a simpler opening balance.
        
        const allEntriesBeforeDate = await getDocs(query(collection(db, 'journalEntries'), where('date', '<', Timestamp.fromDate(upToDate || new Date(0)))));
        let calculatedOpeningBalance = 0;
        allEntriesBeforeDate.forEach(doc => {
             const entry = { id: doc.id, ...doc.data() } as JournalEntry;
             const transaction = entry.transactions.find(t => t.accountId === accountId);
             if(transaction) {
                 calculatedOpeningBalance += accountDoc.normalBalance === 'Debit' ? transaction.debit - transaction.credit : transaction.credit - transaction.debit;
             }
        });


        return { entries: relevantEntries, openingBalance: calculatedOpeningBalance };
    } catch (error) {
        console.error("[getJournalEntriesForAccount Error]", error);
        throw new Error("Gagal mengambil data buku besar.");
    }
}

// --- Fixed Assets ---
export async function getAssets(): Promise<FixedAsset[]> {
  try {
    const q = query(accountsCollection, orderBy('acquisitionDate', 'desc'));
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
    await addDoc(collection(db, 'fixedAssets'), assetData);
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
        collection(db, 'fixedAssets'), 
        where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return { message: "Tidak ada aset aktif untuk disusutkan." };
    }
    
    const depreciationExpenseAccount = await getDocs(query(accountsCollection, where("name", "==", "Beban Penyusutan"), limit(1)));
    const accDepreciationAccount = await getDocs(query(accountsCollection, where("name", "==", "Akumulasi Penyusutan Aset"), limit(1)));

    if (depreciationExpenseAccount.empty || accDepreciationAccount.empty) {
        throw new Error("Akun 'Beban Penyusutan' atau 'Akumulasi Penyusutan Aset' tidak ditemukan.");
    }
    const depreciationAccountId = depreciationExpenseAccount.docs[0].id;
    const accDepreciationAccountId = accDepreciationAccount.docs[0].id;

    let journalEntriesCreated = 0;

    for (const assetDoc of snapshot.docs) {
        const asset = { id: assetDoc.id, ...assetDoc.data() } as FixedAsset;
        const lastDepreciation = asset.lastDepreciationDate?.toDate();

        if (lastDepreciation && lastDepreciation.getFullYear() === currentYear && lastDepreciation.getMonth() === currentMonth) {
            continue; // Already depreciated this month
        }
        
        const monthlyDepreciation = (asset.acquisitionCost - asset.salvageValue) / (asset.usefulLife * 12);
        
        if (monthlyDepreciation > 0) {
            await createJournalEntry({
                date: Timestamp.now(),
                description: `Penyusutan bulanan untuk ${asset.name}`,
                transactions: [
                    { accountId: depreciationAccountId, debit: monthlyDepreciation, credit: 0 }, 
                    { accountId: accDepreciationAccountId, debit: 0, credit: monthlyDepreciation }, 
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

// --- Financial Reports ---
export async function getFinancialReports(startDate: Date, endDate: Date): Promise<FinancialReportData> {
  try {
    const accounts = await getAccounts();
    const accountsMap = new Map(accounts.map(acc => [acc.id!, acc]));
    
    const periods = new Set<string>();
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        periods.add(format(d, 'yyyy-MM'));
    }
    const budgetPromises = Array.from(periods).map(p => getBudgetsForPeriod(p));
    const budgetResults = await Promise.all(budgetPromises);
    const allBudgets = budgetResults.flat();
    const budgetMap = new Map<string, number>();
    allBudgets.forEach(b => {
        budgetMap.set(b.accountId, (budgetMap.get(b.accountId) || 0) + b.amount);
    });

    const cashAccount = accounts.find(a => a.name.toLowerCase().includes('kas'));
    const cashPosition = cashAccount?.balance || 0;

    const q = query(
      journalEntriesCollection,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    const journalSnapshot = await getDocs(q);

    const report: FinancialReportData = {
      incomeStatement: { revenues: [], expenses: [], netIncome: 0, revenueTrend: [], expenseTrend: [], expenseComposition: [] },
      balanceSheet: { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesAndEquity: 0 },
      cashPosition,
    };
    
    const dailyAggregates: Record<string, { revenue: number; expense: number }> = {};
    const accountPeriodChanges = new Map<string, number>();
    const incomeStatementAccountIds = new Set(accounts.filter(a => a.category === 'Pendapatan' || a.category === 'Beban').map(a => a.id));

    journalSnapshot.docs.forEach(doc => {
      const entry = doc.data() as JournalEntry;
      const dateStr = format((entry.date as any).toDate(), 'yyyy-MM-dd');
      
      if (!dailyAggregates[dateStr]) dailyAggregates[dateStr] = { revenue: 0, expense: 0 };

      entry.transactions.forEach(t => {
        const acc = accountsMap.get(t.accountId);
        if (!acc) return;

        if (acc.category === 'Pendapatan') {
          dailyAggregates[dateStr].revenue += t.credit - t.debit;
        } else if (acc.category === 'Beban') {
          dailyAggregates[dateStr].expense += t.debit - t.credit;
        }
        
        if (incomeStatementAccountIds.has(t.accountId)) {
          const currentChange = accountPeriodChanges.get(t.accountId) || 0;
          const change = acc.normalBalance === 'Kredit' ? t.credit - t.debit : t.debit - t.credit;
          accountPeriodChanges.set(t.accountId, currentChange + change);
        }
      });
    });
    
    const sortedDates = Object.keys(dailyAggregates).sort();
    report.incomeStatement.revenueTrend = sortedDates.map(date => ({ date, Pendapatan: dailyAggregates[date].revenue }));
    report.incomeStatement.expenseTrend = sortedDates.map(date => ({ date, Beban: dailyAggregates[date].expense }));
    
    accounts.forEach(acc => {
      if (acc.category === 'Pendapatan' || acc.category === 'Beban') {
        const total = accountPeriodChanges.get(acc.id!) || 0;
        if (total !== 0) {
            const item = { name: acc.name, total, budget: budgetMap.get(acc.id!) || 0 };
            if (acc.category === 'Pendapatan') report.incomeStatement.revenues.push(item);
            else {
              report.incomeStatement.expenses.push(item);
              report.incomeStatement.expenseComposition.push({ name: acc.name, value: total });
            }
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
