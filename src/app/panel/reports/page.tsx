

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getReports, updateReportStatus, takeModerationAction, Report, ReportStatus } from '@/app/actions/reports';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreHorizontal, Check, Clock, ShieldAlert, UserX, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const statusConfig: Record<ReportStatus, { label: string; color: string }> = {
    baru: { label: 'Baru', color: 'bg-red-500' },
    ditinjau: { label: 'Ditinjau', color: 'bg-yellow-500' },
    selesai: { label: 'Selesai', color: 'bg-green-500' },
};

const reasonLabels: Record<Report['reason'], string> = {
  spam: 'Spam/Promosi',
  scam: 'Penipuan',
  ujaran_kebencian: 'Ujaran Kebencian',
  pelecehan: 'Pelecehan',
  konten_ilegal: 'Konten Ilegal',
  lainnya: 'Lainnya',
};

export default function ReportsPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [actionType, setActionType] = useState<'suspend_user' | 'hide_post' | null>(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReports();
            setReports(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal memuat laporan' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleStatusChange = async (id: string, status: ReportStatus) => {
        setActionLoading(id);
        try {
            await updateReportStatus(id, status);
            toast({ title: 'Status laporan diperbarui' });
            fetchReports();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal memperbarui status' });
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleActionConfirm = async () => {
        if (!selectedReport || !actionType) return;

        setActionLoading(selectedReport.id!);
        try {
            await takeModerationAction(actionType, selectedReport.id!);
            toast({ title: 'Tindakan moderasi berhasil diambil.'});
            fetchReports();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Gagal mengambil tindakan', description: (error as Error).message });
        } finally {
            setActionLoading(null);
            setSelectedReport(null);
            setActionType(null);
        }
    }

    return (
        <>
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-2xl font-bold">Manajemen Laporan</h1>
                <p className="text-muted-foreground">Tinjau dan kelola laporan dari pengguna.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Laporan</CardTitle>
                    <CardDescription>Total {reports.length} laporan ditemukan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Dilaporkan</TableHead>
                                <TableHead>Pelapor</TableHead>
                                <TableHead>Alasan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Tidak ada laporan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map(report => {
                                    const reportedItemLink = report.reportedItemType === 'post' 
                                        ? `/p/${report.reportedItemId}` 
                                        : `/profile/${report.reportedItemContent}`;
                                    return (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                <Link href={reportedItemLink} target="_blank" className="hover:underline text-primary text-xs font-mono">
                                                    {report.reportedItemContent || report.reportedItemId}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{report.reporterName}</TableCell>
                                            <TableCell>{reasonLabels[report.reason]}</TableCell>
                                            <TableCell>
                                                <Badge className={statusConfig[report.status].color}>
                                                    {statusConfig[report.status].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(report.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={actionLoading === report.id}>
                                                            {actionLoading === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => { setSelectedReport(report); setActionType(report.reportedItemType === 'post' ? 'hide_post' : 'suspend_user'); }}>
                                                            <ShieldAlert className="mr-2 h-4 w-4"/> Tindak Lanjuti
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleStatusChange(report.id!, 'ditinjau')}>
                                                            <Clock className="mr-2 h-4 w-4"/> Tandai Ditinjau
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(report.id!, 'selesai')}>
                                                             <Check className="mr-2 h-4 w-4"/> Tandai Selesai
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <AlertDialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Tindakan Moderasi</AlertDialogTitle>
                    <AlertDialogDescription>
                       Anda akan mengambil tindakan pada item yang dilaporkan. Tindakan ini juga akan menandai laporan sebagai "Selesai". Lanjutkan?
                       <div className="mt-4 p-4 bg-muted/80 rounded-lg">
                            <p className="font-semibold text-foreground">Item: <span className="font-normal text-sm">{selectedReport?.reportedItemContent || selectedReport?.reportedItemId}</span></p>
                            <p className="font-semibold text-foreground">Aksi: <span className="font-normal text-sm">{actionType === 'hide_post' ? 'Sembunyikan Postingan' : 'Tangguhkan Pengguna'}</span></p>
                       </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleActionConfirm} className="bg-destructive hover:bg-destructive/90">
                        Ya, Lanjutkan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
