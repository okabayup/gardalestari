'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Play, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { scanAllRoutes, ScanResult } from '@/app/actions/health';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function SiteHealthCheckPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const handleStartScan = async () => {
    setLoading(true);
    setResults([]);
    try {
      const scanResults = await scanAllRoutes();
      setResults(scanResults);
      setLastScan(new Date());
      
      const failedCount = scanResults.filter(r => !r.ok).length;
      if (failedCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Pemindaian Selesai',
          description: `Ditemukan ${failedCount} halaman bermasalah.`,
        });
      } else {
        toast({
          title: 'Pemindaian Berhasil',
          description: 'Semua halaman merespons dengan baik.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Pemindaian Gagal',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const errorCount = results.filter(r => !r.ok).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Cek Kesehatan Situs</h1>
          <p className="text-muted-foreground">Pindai semua rute aplikasi untuk mendeteksi error sistem atau halaman mati.</p>
        </div>
        <Button onClick={handleStartScan} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Mulai Pemindaian
        </Button>
      </div>

      {lastScan && (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Halaman Dipindai</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{results.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Halaman Sehat</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{results.length - errorCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Masalah Ditemukan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", errorCount > 0 ? "text-destructive" : "text-muted-foreground")}>
                        {errorCount}
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hasil Pemindaian</CardTitle>
          <CardDescription>
            {lastScan 
              ? `Terakhir dipindai: ${lastScan.toLocaleString('id-ID')}` 
              : 'Klik "Mulai Pemindaian" untuk memeriksa aksesibilitas halaman.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rute (Path)</TableHead>
                <TableHead>Status HTTP</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result) => (
                  <TableRow key={result.route}>
                    <TableCell className="font-mono text-xs">{result.route}</TableCell>
                    <TableCell>
                        <Badge variant={result.ok ? 'outline' : 'destructive'}>
                            {result.status === 0 ? 'FAIL' : result.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {result.ok ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="mr-2 h-4 w-4" /> OK
                        </div>
                      ) : (
                        <div className="flex items-center text-destructive text-sm">
                          <XCircle className="mr-2 h-4 w-4" /> ERROR
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {result.error || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>Memindai rute... mohon jangan tutup halaman ini.</span>
                        </div>
                    ) : 'Belum ada data pemindaian.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { cn } from '@/lib/utils';
