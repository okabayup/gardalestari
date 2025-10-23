

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getJournalEntries, JournalEntry } from '@/app/actions/finance';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { getAccounts, Account } from '@/app/actions/finance';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function JournalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Map<string, Account>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [entriesData, accountsData] = await Promise.all([
          getJournalEntries(),
          getAccounts(),
        ]);
        setEntries(entriesData);
        setAccounts(new Map(accountsData.map(acc => [acc.id!, acc])));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat data jurnal', description: (error as Error).message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Jurnal Umum</h1>
          <p className="text-muted-foreground">Catatan semua transaksi keuangan yang terjadi.</p>
        </div>
         <Button onClick={() => router.push('/panel/finance/journal/new')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Entri
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Entri Jurnal</CardTitle>
          <CardDescription>Total {entries.length} entri ditemukan.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : entries.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {entries.map(entry => (
                        <AccordionItem key={entry.id} value={entry.id!}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span>{format((entry.date as any).toDate(), 'dd MMM yyyy', { locale: idLocale })}</span>
                                    <span className="flex-1 text-left ml-4 truncate">{entry.description}</span>
                                    <span className="text-muted-foreground text-sm">{entry.transactions.length} transaksi</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Akun</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Kredit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entry.transactions.map((t, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{accounts.get(t.accountId)?.name || 'Akun tidak dikenal'}</TableCell>
                                                <TableCell className="text-right font-mono">{t.debit > 0 ? t.debit.toLocaleString('id-ID') : '-'}</TableCell>
                                                <TableCell className="text-right font-mono">{t.credit > 0 ? t.credit.toLocaleString('id-ID') : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                 <div className="text-center py-10 text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4" />
                    <p>Belum ada entri jurnal.</p>
                 </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    