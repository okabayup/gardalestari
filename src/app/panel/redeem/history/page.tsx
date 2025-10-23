
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getRedemptionHistory, RedemptionLog } from '@/app/actions/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const columns: ColumnDef<RedemptionLog>[] = [
    {
        accessorKey: 'userName',
        header: 'Anggota',
    },
    {
        accessorKey: 'itemName',
        header: 'Item',
    },
    {
        accessorKey: 'pointsSpent',
        header: 'Poin Dihabiskan',
    },
    {
        accessorKey: 'redeemedAt',
        header: 'Tanggal',
        cell: ({ row }) => {
            const date = new Date(row.original.redeemedAt);
            return format(date, 'dd MMM yyyy, HH:mm', { locale: idLocale });
        },
    },
];

export default function RedemptionHistoryPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<RedemptionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedLogs = await getRedemptionHistory();
      setLogs(fetchedLogs);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat riwayat' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Riwayat Penukaran Poin</h1>
        <p className="text-muted-foreground">Catatan semua penukaran item yang dilakukan oleh anggota.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Penukaran</CardTitle>
          <CardDescription>Total {logs.length} penukaran tercatat.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
             <DataTable columns={columns} data={logs} placeholder="Cari nama anggota atau item..."/>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
