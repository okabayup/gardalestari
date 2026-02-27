
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, Search, Terminal, Eye } from 'lucide-react';
import { scanAllRoutes, ScanResult } from '@/app/actions/health';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

// Local list of routes to scan to avoid module import issues with Server Actions
const LOCAL_ROUTES_TO_SCAN = [
  '/',
  '/berita',
  '/video',
  '/tentang',
  '/programs',
  '/events',
  '/recruitments',
  '/documents',
  '/announcements',
  '/points',
  '/ideas',
  '/evoting',
  '/panel/dashboard',
  '/panel/members',
  '/panel/finance/dashboard',
  '/panel/settings',
  '/profile/me',
];

export default function SiteHealthCheckPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Console Scanner State
  const [isConsoleScanning, setIsConsoleScanning] = useState(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(-1);
  const [consoleScanResults, setConsoleScanResults] = useState<Record<string, 'pending' | 'success' | 'checking'>>({});

  const handleStartScan = async () => {
    setLoading(true);
    setResults([]);
    try {
      const scanResults = await scanAllRoutes();
      setResults(scanResults);
      
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

  const startConsoleScan = () => {
    setIsConsoleScanning(true);
    setCurrentRouteIndex(0);
    const initialResults: Record<string, 'pending'> = {};
    LOCAL_ROUTES_TO_SCAN.forEach(r => initialResults[r] = 'pending');
    setConsoleScanResults(initialResults);
    toast({ title: 'Deep Scan Dimulai', description: 'Sistem akan membuka halaman satu per satu di jendela tersembunyi.' });
  };

  useEffect(() => {
    if (isConsoleScanning && currentRouteIndex >= 0 && currentRouteIndex < LOCAL_ROUTES_TO_SCAN.length) {
        const route = LOCAL_ROUTES_TO_SCAN[currentRouteIndex];
        setConsoleScanResults(prev => ({ ...prev, [route]: 'checking' }));

        const timer = setTimeout(() => {
            setConsoleScanResults(prev => ({ ...prev, [route]: 'success' }));
            if (currentRouteIndex < LOCAL_ROUTES_TO_SCAN.length - 1) {
                setCurrentRouteIndex(prev => prev + 1);
            } else {
                setIsConsoleScanning(false);
                setCurrentRouteIndex(-1);
                toast({ title: 'Deep Scan Selesai', description: 'Semua halaman telah dikunjungi. Periksa Log Error untuk detail kesalahan yang terekam.' });
            }
        }, 6000); // Wait 6 seconds per page to allow scripts to load and errors to trigger

        return () => clearTimeout(timer);
    }
  }, [isConsoleScanning, currentRouteIndex, toast]);

  const consoleProgress = isConsoleScanning ? ((currentRouteIndex + 1) / LOCAL_ROUTES_TO_SCAN.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold">Cek Kesehatan Situs</h1>
          <p className="text-muted-foreground">Pindai aksesibilitas HTTP dan jalankan Deep Scan untuk mendeteksi error console.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleStartScan} disabled={loading || isConsoleScanning} className="flex-1 sm:flex-none">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Cek HTTP
            </Button>
            <Button onClick={startConsoleScan} disabled={loading || isConsoleScanning} className="flex-1 sm:flex-none">
                {isConsoleScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                Deep Console Scan
            </Button>
        </div>
      </div>

      {isConsoleScanning && (
          <Card className="border-primary bg-primary/5">
              <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sedang Memindai Konsol: {LOCAL_ROUTES_TO_SCAN[currentRouteIndex]}
                    </CardTitle>
                    <span className="text-xs font-mono">{currentRouteIndex + 1} / {LOCAL_ROUTES_TO_SCAN.length}</span>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Progress value={consoleProgress} className="h-2" />
                  <div className="rounded-md border bg-black p-2 h-32 overflow-hidden relative">
                      <iframe 
                        key={LOCAL_ROUTES_TO_SCAN[currentRouteIndex]}
                        src={`${LOCAL_ROUTES_TO_SCAN[currentRouteIndex]}?is_scan=true`} 
                        className="w-[1024px] h-[768px] origin-top-left scale-[0.3] pointer-events-none grayscale"
                        title="Deep Scanner"
                      />
                      <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                         <Badge variant="secondary" className="bg-black/80 text-green-500 font-mono border-green-500">MONITORING ACTIVE</Badge>
                      </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                      * Jendela di atas memuat halaman secara otomatis. Error JavaScript apa pun yang terjadi akan otomatis terekam oleh sistem log kami.
                  </p>
              </CardContent>
          </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Status Aksesibilitas (HTTP)</CardTitle>
                <CardDescription>Hasil pemindaian kode status server terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Rute</TableHead>
                            <TableHead>Hasil</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {results.length > 0 ? (
                            results.map((result) => (
                            <TableRow key={result.route}>
                                <TableCell className="font-mono text-[10px] truncate max-w-[150px]">{result.route}</TableCell>
                                <TableCell>
                                    {result.ok ? (
                                        <Badge variant="outline" className="text-green-600 border-green-200">200 OK</Badge>
                                    ) : (
                                        <Badge variant="destructive">{result.status || 'FAIL'}</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">Belum ada data.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Status Konsol (JS Runtime)</CardTitle>
                <CardDescription>Daftar rute yang telah dikunjungi oleh bot deep scan.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                        {LOCAL_ROUTES_TO_SCAN.map(route => (
                            <div key={route} className="flex items-center justify-between p-2 rounded-md border text-xs">
                                <span className="font-mono truncate flex-1">{route}</span>
                                <div className="flex items-center gap-2">
                                    {consoleScanResults[route] === 'checking' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                                    {consoleScanResults[route] === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                    {consoleScanResults[route] === 'pending' && <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                                    <span className={cn(
                                        "capitalize",
                                        consoleScanResults[route] === 'checking' && "text-blue-500 font-bold",
                                        consoleScanResults[route] === 'success' && "text-green-600"
                                    )}>
                                        {consoleScanResults[route] || 'Menunggu'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center pt-4">
          <Button variant="secondary" asChild>
              <Link href="/panel/analytics/errors">
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Hasil di Log Error
              </Link>
          </Button>
      </div>
    </div>
  );
}
