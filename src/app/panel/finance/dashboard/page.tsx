'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFinancialReports } from '@/app/actions/finance';
import type { FinancialReportData } from '@/lib/definitions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Wallet, Scale, PlusCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Legend } from "recharts"
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const MetricCard = ({ title, value, icon: Icon, isCurrency = true }: { title: string, value: number, icon: React.ElementType, isCurrency?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                 {isCurrency ? value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) : value.toLocaleString('id-ID')}
            </div>
        </CardContent>
    </Card>
);

const chartConfig: ChartConfig = {
    Pendapatan: { label: "Pendapatan", color: "hsl(var(--chart-2))" },
    Beban: { label: "Beban", color: "hsl(var(--chart-5))" },
    Anggaran: { label: "Anggaran", color: "hsl(var(--chart-4))" },
};

export default function FinanceDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
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
  
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const incomeStatement = reportData?.incomeStatement;
  const totalRevenue = incomeStatement?.revenues.reduce((sum, item) => sum + item.total, 0) || 0;
  const totalExpense = incomeStatement?.expenses.reduce((sum, item) => sum + item.total, 0) || 0;
  
  const combinedTrend = incomeStatement?.revenueTrend.map((rev, index) => ({
      date: rev.date,
      Pendapatan: rev.Pendapatan,
      Beban: incomeStatement.expenseTrend[index]?.Beban || 0,
  }));
  
  const expenseCompositionData = (incomeStatement?.expenseComposition || [])
    .sort((a,b) => b.value - a.value)
    .slice(0, 5); // Show top 5 expenses

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold">Dasbor Keuangan</h1>
          <p className="text-muted-foreground">Tinjauan cepat kesehatan keuangan organisasi.</p>
        </div>
         <div className="flex gap-2">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Button onClick={() => router.push('/panel/finance/transactions/new')}>
                <PlusCircle className="mr-2 h-4 w-4"/> Catat Transaksi
            </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Pendapatan" value={totalRevenue} icon={TrendingUp}/>
            <MetricCard title="Total Beban" value={totalExpense} icon={TrendingDown}/>
            <MetricCard title="Laba/Rugi Bersih" value={incomeStatement?.netIncome || 0} icon={Scale} />
            <MetricCard title="Posisi Kas" value={reportData?.cashPosition || 0} icon={Wallet} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
           <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Tren Pendapatan vs Beban</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={combinedTrend}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} stroke="#888888" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} />
                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `Rp${Number(value) / 1000}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="Pendapatan" fill="var(--color-Pendapatan)" radius={4} />
                        <Bar dataKey="Beban" fill="var(--color-Beban)" radius={4} />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Komposisi Beban Teratas</CardTitle>
                <CardDescription>Top 5 kategori pengeluaran terbesar.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                   <BarChart accessibilityLayer data={expenseCompositionData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="value" fill="var(--color-Beban)" radius={4} layout="vertical" />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Perbandingan Anggaran dan Realisasi Beban</CardTitle>
          <CardDescription>Performa pengeluaran dibandingkan dengan anggaran yang ditetapkan.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={incomeStatement?.expenses.map(e => ({ name: e.name, Anggaran: e.budget, Realisasi: e.total}))}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} stroke="#888888" fontSize={10} angle={-15} textAnchor="end" />
                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `Rp${Number(value) / 1000}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="Anggaran" fill="var(--color-Anggaran)" radius={4} />
                    <Bar dataKey="Realisasi" fill="var(--color-Beban)" radius={4} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>


    </div>
  );
}
