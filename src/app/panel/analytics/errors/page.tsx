
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorLogs, ErrorLog } from '@/app/actions/errors';
import ErrorLogTable from '@/components/panel/analytics/ErrorLogTable';
import { Button } from '@/components/ui/button';

export default function ErrorLogPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const errorLogs = await getErrorLogs();
      setLogs(errorLogs);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Log Error',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Log Error Console & Runtime</h1>
          <p className="text-muted-foreground">Tinjau kesalahan JavaScript yang terjadi pada perangkat pengguna secara real-time.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Log
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Error Terekam</CardTitle>
          <CardDescription>Menampilkan 50 error terbaru yang terjadi di sisi klien.</CardDescription>
        </CardHeader>
        <CardContent>
            <ErrorLogTable data={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
