
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function BookingConfirmationPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const bookingId = searchParams.get('bookingId');
    const amount = searchParams.get('amount');
    const finalAmount = Number(amount).toLocaleString('id-ID');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Berhasil disalin!", description: `${text} telah disalin ke clipboard.` });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-md text-center">
                 <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4">Pemesanan Anda Telah Kami Terima!</CardTitle>
                    <CardDescription>
                        Selesaikan pembayaran untuk mengonfirmasi pesanan Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg border bg-background p-4 space-y-4">
                        <div className="text-left">
                            <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                            <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold font-mono">Rp{finalAmount}</p>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(amount || '')}><Copy className="h-4 w-4"/></Button>
                            </div>
                            <p className="text-xs text-destructive">PENTING: Mohon transfer sesuai jumlah unik di atas.</p>
                        </div>
                         <div className="text-left">
                            <p className="text-sm text-muted-foreground">Transfer ke Rekening Berikut</p>
                             <div className="flex items-center justify-between">
                                <p className="text-lg font-semibold">BCA: 1801802325</p>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard('1801802325')}><Copy className="h-4 w-4"/></Button>
                             </div>
                            <p className="text-sm">a.n. Oka Bayu Pratama</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Pesanan Anda akan otomatis dibatalkan jika pembayaran tidak diterima dalam 1x24 jam. Kami akan mengirimkan konfirmasi melalui email setelah pembayaran Anda diverifikasi.
                    </p>
                     <Button asChild className="w-full">
                        <Link href="/edutourism">Kembali ke Daftar Paket</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
