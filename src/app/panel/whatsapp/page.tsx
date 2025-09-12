
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, QrCode, Wifi, WifiOff, LogOut, Send } from 'lucide-react';
import { getBotStatus, startBot, stopBot, logoutBot, sendTestMessage } from '@/app/actions/whatsapp';
import QRCode from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type BotStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'NEEDS_QR';

const StatusIndicator = ({ status }: { status: BotStatus }) => {
  const config = {
    IDLE: { icon: WifiOff, text: 'Tidak Aktif', color: 'text-gray-500' },
    CONNECTING: { icon: Loader2, text: 'Menghubungkan...', color: 'text-yellow-500', animate: true },
    CONNECTED: { icon: Wifi, text: 'Terhubung', color: 'text-green-500' },
    DISCONNECTED: { icon: WifiOff, text: 'Terputus', color: 'text-red-500' },
    NEEDS_QR: { icon: QrCode, text: 'Butuh Pemindaian QR', color: 'text-blue-500' },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-2 font-semibold ${current.color}`}>
      <Icon className={`h-5 w-5 ${current.animate ? 'animate-spin' : ''}`} />
      <span>{current.text}</span>
    </div>
  );
};

export default function WhatsAppManagementPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<BotStatus>('IDLE');
  const [qr, setQr] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Ini adalah pesan tes dari sistem Garda Lestari.');


  const fetchStatus = useCallback(async () => {
    try {
      const botStatus = await getBotStatus();
      setStatus(botStatus.status);
      setQr(botStatus.qr);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mengambil status bot' });
    }
  }, [toast]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleAction = async (action: 'start' | 'stop' | 'logout') => {
    setLoadingAction(true);
    try {
      if (action === 'start') await startBot();
      if (action === 'stop') await stopBot();
      if (action === 'logout') await logoutBot();
      await fetchStatus(); // Immediately refetch after action
    } catch (error) {
      toast({ variant: 'destructive', title: `Gagal melakukan aksi: ${action}` });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNumber || !testMessage) {
        toast({ variant: 'destructive', title: 'Data tidak lengkap', description: 'Nomor dan pesan tes tidak boleh kosong.' });
        return;
    }
    setIsSendingTest(true);
    try {
        await sendTestMessage(testNumber, testMessage);
        toast({ title: 'Pesan tes terkirim!', description: `Mengirim ke ${testNumber}`});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal mengirim pesan', description: (error as Error).message });
    } finally {
        setIsSendingTest(false);
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Manajemen Bot WhatsApp</h1>
        <p className="text-muted-foreground">Hubungkan dan kelola bot notifikasi WhatsApp Anda.</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Peringatan Penting</AlertTitle>
        <AlertDescription>
          Fitur ini menggunakan API tidak resmi dan berisiko membuat nomor WhatsApp Anda diblokir. Gunakan dengan hati-hati dan dengan nomor yang didedikasikan untuk bot. Layanan bot adalah proses terpisah dan **harus dijalankan di server Anda sendiri** agar berfungsi.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Status & Kontrol Bot</CardTitle>
            <CardDescription>
                Pindai QR code dengan aplikasi WhatsApp Anda untuk menghubungkan.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="text-sm font-medium">Status Saat Ini:</span>
                    <StatusIndicator status={status} />
                </div>

                {status === 'NEEDS_QR' && qr && (
                    <div className="flex flex-col items-center justify-center gap-4 p-4 border-2 border-dashed rounded-lg">
                        <p className="font-semibold">Pindai untuk Menghubungkan</p>
                        <div className="bg-white p-2 rounded-md">
                            <QRCode value={qr} size={256} />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Buka WhatsApp di ponsel Anda > Perangkat Tertaut > Tautkan Perangkat</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button onClick={() => handleAction('start')} disabled={loadingAction || status === 'CONNECTED' || status === 'CONNECTING'}>
                        {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Start Bot
                    </Button>
                    <Button variant="outline" onClick={() => handleAction('stop')} disabled={loadingAction || status === 'IDLE' || status === 'DISCONNECTED'}>
                        {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Stop Bot
                    </Button>
                    <Button variant="destructive" onClick={() => handleAction('logout')} disabled={loadingAction}>
                        {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogOut className="mr-2 h-4 w-4"/>}
                        Logout & Hapus Sesi
                    </Button>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Kirim Pesan Tes</CardTitle>
                <CardDescription>Verifikasi apakah bot Anda dapat mengirim pesan.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSendTest} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="testNumber">Nomor WhatsApp Tujuan</Label>
                        <Input 
                            id="testNumber"
                            value={testNumber}
                            onChange={(e) => setTestNumber(e.target.value)}
                            placeholder="Contoh: 6281234567890"
                            required
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="testMessage">Isi Pesan</Label>
                        <Textarea 
                            id="testMessage"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSendingTest || status !== 'CONNECTED'}>
                        {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        Kirim Pesan Tes
                    </Button>
                    {status !== 'CONNECTED' && <p className="text-xs text-center text-destructive">Bot harus dalam status "Terhubung" untuk mengirim pesan.</p>}
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
