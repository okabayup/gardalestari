'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFinancialReports } from '@/app/actions/finance';
import type { FinancialReportData } from '@/lib/definitions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncomeStatement from '@/components/panel/finance/IncomeStatement';
import BalanceSheet from '@/components/panel/finance/BalanceSheet';

export default function FinancialReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setLoading(true);
      getFinancialReports(dateRange.from, dateRange.to)
        .then(data => {
          setReportData(data);
        })
        .catch(error => {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal memuat laporan', description: error.message });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dateRange, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis kesehatan keuangan organisasi Anda.</p>
        </div>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>

      <Tabs defaultValue="income-statement">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income-statement">Laporan Laba Rugi</TabsTrigger>
          <TabsTrigger value="balance-sheet">Neraca</TabsTrigger>
        </TabsList>
        <TabsContent value="income-statement">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Laba Rugi</CardTitle>
                    <CardDescription>
                        Menunjukkan pendapatan dan beban selama periode yang dipilih.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : reportData ? (
                        <IncomeStatement data={reportData.incomeStatement} />
                    ) : (
                        <p>Tidak ada data untuk ditampilkan.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="balance-sheet">
             <Card>
                <CardHeader>
                    <CardTitle>Neraca</CardTitle>
                    <CardDescription>
                       Menunjukkan posisi keuangan (aset, liabilitas, ekuitas) pada akhir periode.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : reportData ? (
                        <BalanceSheet data={reportData.balanceSheet} />
                    ) : (
                        <p>Tidak ada data untuk ditampilkan.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
