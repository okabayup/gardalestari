'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialReportData } from "@/lib/definitions";

const ReportRow = ({ label, value, isTotal = false, isSub = false }: { label: string, value: number, isTotal?: boolean, isSub?: boolean }) => (
    <TableRow className={isTotal ? 'font-bold bg-muted/50' : ''}>
        <TableCell className={isSub ? 'pl-8' : ''}>{label}</TableCell>
        <TableCell className="text-right font-mono">{value < 0 ? `(${Math.abs(value).toLocaleString('id-ID')})` : value.toLocaleString('id-ID')}</TableCell>
    </TableRow>
);


export default function BalanceSheet({ data }: { data: FinancialReportData['balanceSheet'] }) {
  const totalLiabilities = data.liabilities.reduce((sum, item) => sum + item.balance, 0);
  const totalEquity = data.equity.reduce((sum, item) => sum + item.balance, 0);
  
  return (
    <div className="grid md:grid-cols-2 gap-8">
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Aset</TableHead>
                        <TableHead className="text-right">Jumlah (Rp)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.assets.map(item => <ReportRow key={item.name} label={item.name} value={item.balance} isSub />)}
                    <ReportRow label="Total Aset" value={data.totalAssets} isTotal/>
                </TableBody>
            </Table>
        </div>
         <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Liabilitas dan Ekuitas</TableHead>
                        <TableHead className="text-right">Jumlah (Rp)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow><TableCell colSpan={2} className="font-semibold p-2">Liabilitas</TableCell></TableRow>
                    {data.liabilities.map(item => <ReportRow key={item.name} label={item.name} value={item.balance} isSub />)}
                    <ReportRow label="Total Liabilitas" value={totalLiabilities} isTotal/>

                    <TableRow><TableCell colSpan={2} className="font-semibold p-2 pt-4">Ekuitas</TableCell></TableRow>
                    {data.equity.map(item => <ReportRow key={item.name} label={item.name} value={item.balance} isSub/>)}
                     <ReportRow label="Total Ekuitas" value={totalEquity} isTotal/>
                     
                    <TableRow className="font-bold bg-primary/10">
                        <TableCell>Total Liabilitas dan Ekuitas</TableCell>
                        <TableCell className="text-right font-mono">{data.totalLiabilitiesAndEquity.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
