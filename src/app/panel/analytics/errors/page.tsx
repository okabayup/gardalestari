'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorLogs, ErrorLog } from '@/app/actions/errors';
import ErrorLogTable from '@/components/panel/analytics/ErrorLogTable';

export default function ErrorLogPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
    fetchLogs();
  }, [toast]);

  if (loading) {
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
          <h1 className="font-headline text-2xl font-bold">Log Error Aplikasi</h1>
          <p className="text-muted-foreground">Tinjau error yang terjadi di sisi klien pada alur-alur penting.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Error</CardTitle>
          <CardDescription>Menampilkan 50 error terbaru yang tercatat.</CardDescription>
        </CardHeader>
        <CardContent>
            <ErrorLogTable data={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
