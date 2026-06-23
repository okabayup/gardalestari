
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getInvoices, Invoice } from '@/app/actions/finance';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusConfig: Record<Invoice['status'], { label: string; className: string }> = {
  draft: { label: 'Draf', className: 'bg-gray-500' },
  sent: { label: 'Terkirim', className: 'bg-blue-500' },
  paid: { label: 'Lunas', className: 'bg-green-500' },
  void: { label: 'Batal', className: 'bg-red-500' },
};


export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // Assuming getInvoices function exists
      // const fetchedInvoices = await getInvoices();
      // setInvoices(fetchedInvoices);
      // For now, using empty array as getInvoices is not implemented
      setInvoices([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat faktur' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // For now, this will just set loading to false as getInvoices is not there
    fetchInvoices();
  }, [fetchInvoices]);

  const memoizedColumns = useMemo<ColumnDef<Invoice>[]>(() => [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nomor Faktur" />,
      cell: ({ row }) => <span className="font-mono">{row.original.invoiceNumber}</span>,
    },
    {
      accessorKey: 'contactName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
    },
    {
      accessorKey: 'date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
      cell: ({ row }) => format(new Date(row.original.date as string), 'dd MMM yyyy', { locale: idLocale }),
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jatuh Tempo" />,
      cell: ({ row }) => format(new Date(row.original.dueDate as string), 'dd MMM yyyy', { locale: idLocale }),
    },
    {
        accessorKey: 'total',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
        cell: ({ row }) => <span className="font-mono">{row.original.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
              <DropdownMenuItem>Catat Pembayaran</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const toolbarButtons = (
    <Button onClick={() => router.push('/panel/finance/invoices/new')}>
      <PlusCircle className="mr-2 h-4 w-4" /> Buat Faktur Baru
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Faktur Penjualan (AR)</h1>
        <p className="text-muted-foreground">Kelola semua faktur penjualan dan piutang usaha Anda.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={memoizedColumns}
          data={invoices}
          placeholder="Cari nomor faktur atau pelanggan..."
          toolbarButtons={toolbarButtons}
        />
      )}
    </div>
  );
}
