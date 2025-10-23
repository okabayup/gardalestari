
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getJournalEntriesForAccount, getAccountDetails, JournalEntry, Account } from '@/app/actions/finance';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface LedgerRow {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function LedgerPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;
  const { toast } = useToast();

  const [account, setAccount] = useState<Account | null>(null);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accountId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [accountDetails, entries] = await Promise.all([
            getAccountDetails(accountId),
            getJournalEntriesForAccount(accountId),
          ]);
          
          if (!accountDetails) {
            toast({ variant: 'destructive', title: 'Akun tidak ditemukan' });
            router.push('/panel/finance/accounts');
            return;
          }
          setAccount(accountDetails);

          // Calculate running balance
          let runningBalance = 0; // We start from 0 and build up
          const rows = entries.map(entry => {
            const transaction = entry.transactions.find(t => t.accountId === accountId);
            if (!transaction) return null;

            const { debit, credit } = transaction;
            let change = 0;
            if (accountDetails.normalBalance === 'Debit') {
                change = debit - credit;
            } else {
                change = credit - debit;
            }
            runningBalance += change;

            return {
              date: (entry.date as any).toDate(),
              description: entry.description,
              debit,
              credit,
              balance: runningBalance,
            };
          }).filter((row): row is LedgerRow => row !== null);
          
          setLedgerRows(rows);
          
        } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal memuat buku besar', description: (error as Error).message });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [accountId, router, toast]);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/panel/finance/accounts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Bagan Akun
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buku Besar: {account?.name}</CardTitle>
          <CardDescription>Menampilkan semua transaksi untuk akun <span className="font-mono">{account?.code}</span>. Saldo Akhir: <span className="font-bold">{ledgerRows.at(-1)?.balance.toLocaleString('id-ID', {style: 'currency', currency: 'IDR'}) || 'Rp 0'}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Debit (Rp)</TableHead>
                <TableHead className="text-right">Kredit (Rp)</TableHead>
                <TableHead className="text-right">Saldo (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerRows.length > 0 ? (
                ledgerRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(row.date, 'dd MMM yyyy', { locale: idLocale })}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell className="text-right font-mono">{row.debit > 0 ? row.debit.toLocaleString('id-ID') : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{row.credit > 0 ? row.credit.toLocaleString('id-ID') : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{row.balance.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Tidak ada transaksi untuk akun ini.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
