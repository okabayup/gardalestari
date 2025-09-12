'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { sendTestMessage, sendBulkTestMessage } from '@/app/actions/whatsapp';
import { useRouter } from 'next/navigation';

const singleMessageSchema = z.object({
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});
type SingleMessageFormData = z.infer<typeof singleMessageSchema>;

const bulkMessageSchema = z.object({
  phoneNumbers: z.string().min(10, 'Setidaknya satu nomor telepon dibutuhkan'),
  bulkMessage: z.string().min(1, 'Pesan tidak boleh kosong'),
});
type BulkMessageFormData = z.infer<typeof bulkMessageSchema>;


export default function WhatsappTestPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingBulk, setLoadingBulk] = useState(false);
  
  const singleForm = useForm<SingleMessageFormData>({ resolver: zodResolver(singleMessageSchema) });
  const bulkForm = useForm<BulkMessageFormData>({ resolver: zodResolver(bulkMessageSchema) });

  const onTestSubmit = async (data: SingleMessageFormData) => {
    setLoadingSingle(true);
    try {
      const formattedNumber = data.phoneNumber.startsWith('0') ? `62${data.phoneNumber.substring(1)}` : data.phoneNumber;
      await sendTestMessage(formattedNumber, data.message);
      toast({ title: 'Pesan Terkirim!', description: `Pesan tes berhasil dikirim ke ${formattedNumber}` });
      singleForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim', description: (error as Error).message });
    } finally {
      setLoadingSingle(false);
    }
  };
  
  const onBulkTestSubmit = async (data: BulkMessageFormData) => {
    setLoadingBulk(true);
     try {
      const result = await sendBulkTestMessage(data.phoneNumbers, data.bulkMessage);
      toast({ title: 'Pesan Massal Terkirim!', description: `Pesan tes berhasil dikirim ke ${result.count} nomor.` });
      bulkForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim Pesan Massal', description: (error as Error).message });
    } finally {
      setLoadingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen WhatsApp</h1>
            <p className="text-muted-foreground">Kelola pengaturan notifikasi dan uji coba pengiriman pesan.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/panel/whatsapp/templates')}>
            Kelola Template Notifikasi
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Uji Kirim Pesan Tunggal</CardTitle>
            <CardDescription>Verifikasi koneksi dengan API SatuConnect dengan mengirim pesan tes ke satu nomor.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={singleForm.handleSubmit(onTestSubmit)} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="phoneNumber">Nomor Telepon Tujuan</Label>
                <Input id="phoneNumber" type="tel" {...singleForm.register('phoneNumber')} placeholder="Contoh: 081234567890" />
                {singleForm.formState.errors.phoneNumber && <p className="text-sm text-destructive">{singleForm.formState.errors.phoneNumber.message}</p>}
                </div>
                <div className="space-y-2">
                <Label htmlFor="message">Isi Pesan</Label>
                <Textarea id="message" {...singleForm.register('message')} placeholder="Ini adalah pesan tes dari Garda Lestari."/>
                {singleForm.formState.errors.message && <p className="text-sm text-destructive">{singleForm.formState.errors.message.message}</p>}
                </div>
                <Button type="submit" disabled={loadingSingle} className="w-full">
                {loadingSingle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Kirim Pesan Tes
                </Button>
            </form>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
            <CardTitle>Uji Kirim Pesan Massal</CardTitle>
            <CardDescription>Uji pengiriman pesan ke beberapa nomor sekaligus. Pisahkan nomor dengan koma.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={bulkForm.handleSubmit(onBulkTestSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="phoneNumbers">Nomor Telepon Tujuan (pisahkan dengan koma)</Label>
                    <Textarea id="phoneNumbers" {...bulkForm.register('phoneNumbers')} placeholder="6281..., 6285..., 0812..." />
                    {bulkForm.formState.errors.phoneNumbers && <p className="text-sm text-destructive">{bulkForm.formState.errors.phoneNumbers.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bulkMessage">Isi Pesan</Label>
                    <Textarea id="bulkMessage" {...bulkForm.register('bulkMessage')} placeholder="Ini adalah pengumuman untuk semua anggota."/>
                    {bulkForm.formState.errors.bulkMessage && <p className="text-sm text-destructive">{bulkForm.formState.errors.bulkMessage.message}</p>}
                </div>
                <Button type="submit" disabled={loadingBulk} className="w-full">
                    {loadingBulk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Pesan Massal
                </Button>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
