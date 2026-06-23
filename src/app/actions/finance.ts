'use server';

import { revalidatePath } from 'next/cache';
import type { Account, JournalEntry, JournalTransaction, FinancialReportData, Budget, Contact, Invoice } from '@/lib/definitions';
import { format } from 'date-fns';
import { getAll, getOne, create, update, remove, set, now } from '@/lib/db';

const COL_ACCOUNTS = 'accounts';
const COL_JOURNAL = 'journalEntries';
const COL_BUDGETS = 'budgets';
const COL_CONTACTS = 'contacts';
const COL_INVOICES = 'invoices';

export async function getFinancialReports(startDate: Date, endDate: Date): Promise<FinancialReportData> {
  try {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const [accounts, entries, budgets] = await Promise.all([
      getAll<Account>(COL_ACCOUNTS, { orderBy: { field: 'code', direction: 'asc' } }),
      getAll<any>(COL_JOURNAL, {
        where: [
          { field: 'date', op: '>=', value: startIso },
          { field: 'date', op: '<=', value: endIso },
        ],
        orderBy: { field: 'date', direction: 'asc' },
      }),
      getAll<Budget>(COL_BUDGETS, {
        where: { field: 'period', op: '==', value: format(startDate, 'yyyy-MM') },
      }),
    ]);

    const revenues: Record<string, { name: string; total: number }> = {};
    const expenses: Record<string, { name: string; total: number; budget: number }> = {};

    entries.forEach(entry => {
      (entry.transactions || []).forEach((trans: any) => {
        const account = accounts.find(a => a.id === trans.accountId);
        if (!account) return;

        if (account.category === 'Pendapatan') {
          if (!revenues[account.id!]) revenues[account.id!] = { name: account.name, total: 0 };
          revenues[account.id!].total += (trans.credit - trans.debit);
        } else if (account.category === 'Beban') {
          if (!expenses[account.id!]) {
            const budget = budgets.find(b => b.accountId === account.id)?.amount || 0;
            expenses[account.id!] = { name: account.name, total: 0, budget };
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
      // Handle both ISO strings and Firestore Timestamp objects (migrated data)
      const dateStr = typeof entry.date === 'string' ? entry.date :
        entry.date?.toDate ? entry.date.toDate().toISOString() : String(entry.date);
      const dateKey = format(new Date(dateStr), 'yyyy-MM-dd');

      (entry.transactions || []).forEach((trans: any) => {
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
      cashPosition: accounts
        .filter(a => a.category === 'Aset' && (a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank')))
        .reduce((sum, a) => sum + a.balance, 0),
    };
  } catch (error) {
    console.error("[getFinancialReports Error]", error);
    throw new Error("Gagal menghasilkan laporan keuangan.");
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const rows = await getAll<any>(COL_INVOICES, { orderBy: { field: 'createdAt', direction: 'desc' } });
    return rows as unknown as Invoice[];
  } catch (error) {
    console.error("[getInvoices Error]", error);
    return [];
  }
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>, userId: string) {
  try {
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceId = crypto.randomUUID();

    await create(COL_INVOICES, {
      ...data,
      invoiceNumber,
      status: 'draft' as const,
      createdAt: now(),
      createdBy: userId,
    } as Record<string, unknown>, invoiceId);

    // Create matching journal entry
    const journalEntry: Omit<JournalEntry, 'id' | 'createdAt'> = {
      date: data.date,
      description: `Faktur Penjualan #${invoiceNumber} untuk ${data.contactName}`,
      transactions: [
        { accountId: 'Piutang Usaha', debit: data.total, credit: 0 },
        { accountId: 'Pendapatan Jasa', debit: 0, credit: data.subtotal },
        { accountId: 'Utang PPN', debit: 0, credit: data.tax },
      ],
      createdBy: userId,
      relatedInvoiceId: invoiceId,
    };
    await createJournalEntry(journalEntry);

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
  const rows = await getAll<Contact>(COL_CONTACTS, { orderBy: { field: 'name', direction: 'asc' } });
  return rows;
}

export async function createContact(data: Omit<Contact, 'id' | 'createdAt'>) {
  await create(COL_CONTACTS, { ...data, createdAt: now() });
  revalidatePath('/panel/finance/contacts');
}

export async function updateContact(id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) {
  await update(COL_CONTACTS, id, data as Record<string, unknown>);
  revalidatePath('/panel/finance/contacts');
}

export async function deleteContact(id: string) {
  await remove(COL_CONTACTS, id);
  revalidatePath('/panel/finance/contacts');
}

export async function getBudgetsForPeriod(period: string): Promise<Budget[]> {
  try {
    return await getAll<Budget>(COL_BUDGETS, {
      where: { field: 'period', op: '==', value: period },
    });
  } catch (error) {
    console.error("[getBudgetsForPeriod Error]", error);
    throw new Error("Gagal mengambil data anggaran.");
  }
}

export async function saveBudgets(period: string, budgets: { accountId: string; accountName: string; amount: number }[]) {
  try {
    // Upsert budgets using composite ID (period_accountId)
    await Promise.all(
      budgets.map(budget => {
        const docId = `${period}_${budget.accountId}`;
        return set(COL_BUDGETS, docId, {
          period,
          accountId: budget.accountId,
          accountName: budget.accountName,
          amount: budget.amount,
          createdAt: now(),
        });
      })
    );
    revalidatePath('/panel/finance/budgets');
    revalidatePath('/panel/finance/reports');
  } catch (error) {
    console.error("[saveBudgets Error]", error);
    throw new Error("Gagal menyimpan data anggaran.");
  }
}

export async function getAccountDetails(accountId: string): Promise<Account | null> {
  try {
    return await getOne<Account>(COL_ACCOUNTS, accountId);
  } catch (error) {
    console.error("[getAccountDetails Error]", error);
    throw new Error("Gagal mengambil detail akun.");
  }
}

export async function getAccounts(): Promise<Account[]> {
  try {
    return await getAll<Account>(COL_ACCOUNTS, { orderBy: { field: 'code', direction: 'asc' } });
  } catch (error) {
    console.error("[getAccounts Error]", error);
    throw new Error("Gagal mengambil data Daftar Akun.");
  }
}

export async function createAccount(data: Omit<Account, 'id' | 'createdAt' | 'balance'>) {
  try {
    await create(COL_ACCOUNTS, { ...data, balance: 0, createdAt: now() });
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[createAccount Error]", error);
    throw new Error(`Gagal membuat akun: ${(error as Error).message}`);
  }
}

export async function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'createdAt' | 'balance'>>) {
  try {
    await update(COL_ACCOUNTS, id, data as Record<string, unknown>);
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[updateAccount Error]", error);
    throw new Error(`Gagal memperbarui akun: ${(error as Error).message}`);
  }
}

export async function deleteAccount(id: string) {
  try {
    await remove(COL_ACCOUNTS, id);
    revalidatePath('/panel/finance/accounts');
  } catch (error) {
    console.error("[deleteAccount Error]", error);
    throw new Error(`Gagal menghapus akun: ${(error as Error).message}`);
  }
}

export async function createSimpleTransaction(
  type: 'income' | 'expense',
  date: string | Date,
  amount: number,
  description: string,
  cashBankAccountId: string,
  categoryAccountId: string,
  userId: string
) {
  const debitAccount = type === 'expense' ? categoryAccountId : cashBankAccountId;
  const creditAccount = type === 'expense' ? cashBankAccountId : categoryAccountId;

  const entry: Omit<JournalEntry, 'id' | 'createdAt'> = {
    date: date instanceof Date ? date.toISOString() as any : date as any,
    description,
    transactions: [
      { accountId: debitAccount, debit: amount, credit: 0 },
      { accountId: creditAccount, debit: 0, credit: amount },
    ],
    createdBy: userId,
  };

  await createJournalEntry(entry);
}

// Internal helper: create journal entry and update account balances (sequential, no atomicity)
async function createJournalEntryInternal(data: Omit<JournalEntry, 'id' | 'createdAt'>) {
  const dateStr = data.date instanceof Date
    ? (data.date as Date).toISOString()
    : (typeof data.date === 'string' ? data.date : new Date().toISOString());

  await create(COL_JOURNAL, { ...data, date: dateStr, createdAt: now() });

  // Update account balances sequentially
  for (const trans of data.transactions) {
    const account = await getOne<Account>(COL_ACCOUNTS, trans.accountId);
    if (!account) {
      throw new Error(`Akun dengan ID "${trans.accountId}" tidak ditemukan.`);
    }

    let amountChange = 0;
    if (account.normalBalance === 'Debit') {
      amountChange = trans.debit - trans.credit;
    } else {
      amountChange = trans.credit - trans.debit;
    }
    await update(COL_ACCOUNTS, trans.accountId, { balance: (account.balance || 0) + amountChange });
  }
}

export async function createJournalEntry(data: Omit<JournalEntry, 'id' | 'createdAt'>) {
  try {
    await createJournalEntryInternal(data);

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
    return await getAll<any>(COL_JOURNAL, { orderBy: { field: 'date', direction: 'desc' } });
  } catch (error) {
    console.error("[getJournalEntries Error]", error);
    throw new Error("Gagal mengambil data Buku Jurnal.");
  }
}

export async function getJournalEntriesForAccount(accountId: string): Promise<any[]> {
  try {
    // Fetch all journal entries and filter client-side by accountId in transactions array
    // (Supabase JSONB array-contains-any on nested objects requires raw query; client filter is simpler)
    const allEntries = await getAll<any>(COL_JOURNAL);
    return allEntries
      .filter((entry: any) => (entry.transactions || []).some((t: any) => t.accountId === accountId))
      .sort((a: any, b: any) => {
        const da = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString();
        const db_ = typeof b.date === 'string' ? b.date : new Date(b.date).toISOString();
        return da.localeCompare(db_);
      });
  } catch (error) {
    console.error("[getJournalEntriesForAccount Error]", error);
    throw new Error("Gagal mengambil data buku besar.");
  }
}
