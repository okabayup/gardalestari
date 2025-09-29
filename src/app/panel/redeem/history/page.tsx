'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getRedemptionHistory, RedemptionLog } from '@/app/actions/points';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Poin Dihabiskan</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>{log.itemName}</TableCell>
                      <TableCell>{log.pointsSpent}</TableCell>
                      <TableCell>{format(new Date(log.redeemedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      Belum ada riwayat penukaran.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
