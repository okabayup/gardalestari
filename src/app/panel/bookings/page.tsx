
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getBookings, confirmPayment, Booking } from '@/app/actions/booking';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const statusConfig: Record<Booking['status'], { label: string; className: string }> = {
  pending: { label: 'Menunggu Pembayaran', className: 'bg-yellow-500' },
  paid: { label: 'Lunas', className: 'bg-green-500' },
  confirmed: { label: 'Terkonfirmasi', className: 'bg-blue-500' },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-500' },
  completed: { label: 'Selesai', className: 'bg-gray-500' },
};

export default function BookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToConfirm, setItemToConfirm] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat pemesanan' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirmClick = (item: Booking) => {
    setItemToConfirm(item);
    setShowConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!itemToConfirm?.id) return;
    setActionLoading(itemToConfirm.id);
    try {
      await confirmPayment(itemToConfirm.id);
      toast({ title: 'Pembayaran dikonfirmasi!', description: `Notifikasi telah dikirim ke ${itemToConfirm.customerName}` });
      fetchBookings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mengonfirmasi', description: (error as Error).message });
    } finally {
      setActionLoading(null);
      setShowConfirmDialog(false);
      setItemToConfirm(null);
    }
  };

  const columns = useMemo<ColumnDef<Booking>[]>(() => [
    {
      accessorKey: 'customerName',
      header: 'Nama Pelanggan',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.original.customerEmail}</div>
        </div>
      ),
    },
    { accessorKey: 'packageName', header: 'Paket' },
    {
      accessorKey: 'bookingDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Kunjungan" />,
      cell: ({ row }) => format(row.original.bookingDate.toDate(), 'dd MMM yyyy', { locale: idLocale }),
    },
    {
      accessorKey: 'totalPrice',
      header: 'Total Bayar',
      cell: ({ row }) => <span className="font-mono">Rp{row.original.totalPrice.toLocaleString('id-ID')}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <div className="text-right">
            {booking.status === 'pending' && (
              <Button size="sm" onClick={() => handleConfirmClick(booking)} disabled={actionLoading === booking.id}>
                {actionLoading === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                Konfirmasi Bayar
              </Button>
            )}
          </div>
        );
      },
    },
  ], [actionLoading]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Pemesanan Eduwisata</h1>
          <p className="text-muted-foreground">Tinjau dan kelola semua pemesanan yang masuk.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pemesanan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <DataTable
                columns={columns}
                data={bookings}
                placeholder="Cari nama atau email..."
                facetedFilters={[
                  {
                    columnId: 'status',
                    title: 'Status',
                    options: Object.entries(statusConfig).map(([value, { label }]) => ({ value, label })),
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menandai pesanan untuk <span className="font-bold">{itemToConfirm?.customerName}</span> sebesar <span className="font-bold font-mono">Rp{itemToConfirm?.totalPrice.toLocaleString('id-ID')}</span> sebagai lunas. Notifikasi akan dikirim ke pelanggan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment}>Ya, Konfirmasi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
