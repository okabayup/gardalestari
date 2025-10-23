
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFinancialReports, FinancialReportData } from '@/app/actions/finance';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Wallet, Scale } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts"

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
};

const expenseCompColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#84d8e1"];

export default function FinanceDashboardPage() {
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
  
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const incomeStatement = reportData?.incomeStatement;
  const totalRevenue = incomeStatement?.revenues.reduce((sum, item) => sum + item.total, 0) || 0;
  const totalExpense = incomeStatement?.expenses.reduce((sum, item) => sum + item.total, 0) || 0;

  const expenseCompositionData = incomeStatement?.expenses.map(exp => ({ name: exp.name, value: exp.total })) || [];
  
  const combinedTrend = incomeStatement?.revenueTrend.map((rev, index) => ({
      date: rev.date,
      Pendapatan: rev.Pendapatan,
      Beban: incomeStatement.expenseTrend[index]?.Beban || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold">Dasbor Keuangan</h1>
          <p className="text-muted-foreground">Tinjauan cepat kesehatan keuangan organisasi.</p>
        </div>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Pendapatan" value={totalRevenue} icon={TrendingUp}/>
            <MetricCard title="Total Beban" value={totalExpense} icon={TrendingDown}/>
            <MetricCard title="Laba/Rugi Bersih" value={incomeStatement?.netIncome || 0} icon={Scale} />
            <MetricCard title="Posisi Kas" value={reportData?.cashPosition || 0} icon={Wallet} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
           <Card>
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
                        <Bar dataKey="Pendapatan" fill="var(--color-Pendapatan)" radius={4} />
                        <Bar dataKey="Beban" fill="var(--color-Beban)" radius={4} />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Komposisi Beban</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                         <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                         <Pie data={expenseCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {expenseCompositionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={expenseCompColors[index % expenseCompColors.length]} />
                            ))}
                         </Pie>
                    </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
      </div>

    </div>
  );
}

    