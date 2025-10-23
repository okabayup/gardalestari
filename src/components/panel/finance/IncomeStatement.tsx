'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialReportData } from "@/lib/definitions";

const ReportRow = ({ label, value, isTotal = false, isSub = false }: { label: string, value: number, isTotal?: boolean, isSub?: boolean }) => (
    <TableRow className={isTotal ? 'font-bold bg-muted/50' : ''}>
        <TableCell className={isSub ? 'pl-8' : ''}>{label}</TableCell>
        <TableCell className="text-right font-mono">{value.toLocaleString('id-ID')}</TableCell>
    </TableRow>
);


export default function IncomeStatement({ data }: { data: FinancialReportData['incomeStatement'] }) {
  const totalRevenue = data.revenues.reduce((sum, item) => sum + item.total, 0);
  const totalExpense = data.expenses.reduce((sum, item) => sum + item.total, 0);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-right">Jumlah (Rp)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow><TableCell colSpan={2} className="font-semibold p-2">Pendapatan</TableCell></TableRow>
        {data.revenues.map(item => <ReportRow key={item.name} label={item.name} value={item.total} isSub/>)}
        <ReportRow label="Total Pendapatan" value={totalRevenue} isTotal/>
        
        <TableRow><TableCell colSpan={2} className="font-semibold p-2 pt-6">Beban</TableCell></TableRow>
        {data.expenses.map(item => <ReportRow key={item.name} label={item.name} value={item.total} isSub/>)}
        <ReportRow label="Total Beban" value={totalExpense} isTotal/>

        <TableRow className="font-bold text-lg bg-primary/10">
            <TableCell>Laba (Rugi) Bersih</TableCell>
            <TableCell className="text-right font-mono">{data.netIncome.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
