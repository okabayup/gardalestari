
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialReportData } from "@/lib/definitions";
import { cn } from "@/lib/utils";

const ReportRow = ({ label, value, budget, isTotal = false, isSub = false }: { label: string; value: number; budget?: number, isTotal?: boolean; isSub?: boolean }) => {
    const variance = budget ? value - budget : null;
    const percentage = budget ? (value / budget) * 100 : null;

    return (
        <TableRow className={isTotal ? 'font-bold bg-muted/50' : ''}>
            <TableCell className={isSub ? 'pl-8' : ''}>{label}</TableCell>
            <TableCell className="text-right font-mono">{budget?.toLocaleString('id-ID') || '-'}</TableCell>
            <TableCell className="text-right font-mono">{value.toLocaleString('id-ID')}</TableCell>
            <TableCell className={cn("text-right font-mono", variance && variance > 0 ? 'text-red-600' : 'text-green-600')}>
                {variance !== null ? variance.toLocaleString('id-ID') : '-'}
            </TableCell>
             <TableCell className={cn("text-right font-mono", percentage && percentage > 100 ? 'text-red-600' : 'text-green-600')}>
                {percentage !== null ? `${percentage.toFixed(1)}%` : '-'}
            </TableCell>
        </TableRow>
    );
};


export default function IncomeStatement({ data }: { data: FinancialReportData['incomeStatement'] }) {
  const totalRevenue = data.revenues.reduce((sum, item) => sum + item.total, 0);
  const totalExpense = data.expenses.reduce((sum, item) => sum + item.total, 0);
  const totalBudget = data.expenses.reduce((sum, item) => sum + (item.budget || 0), 0);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-right">Anggaran (Rp)</TableHead>
          <TableHead className="text-right">Realisasi (Rp)</TableHead>
          <TableHead className="text-right">Varian (Rp)</TableHead>
          <TableHead className="text-right">Realisasi (%)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow><TableCell colSpan={5} className="font-semibold p-2">Pendapatan</TableCell></TableRow>
        {data.revenues.map(item => <ReportRow key={item.name} label={item.name} value={item.total} isSub/>)}
        <ReportRow label="Total Pendapatan" value={totalRevenue} isTotal/>
        
        <TableRow><TableCell colSpan={5} className="font-semibold p-2 pt-6">Beban</TableCell></TableRow>
        {data.expenses.map(item => <ReportRow key={item.name} label={item.name} value={item.total} budget={item.budget} isSub/>)}
        <ReportRow label="Total Beban" value={totalExpense} budget={totalBudget} isTotal/>

        <TableRow className="font-bold text-lg bg-primary/10">
            <TableCell>Laba (Rugi) Bersih</TableCell>
            <TableCell colSpan={4} className="text-right font-mono">{data.netIncome.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
