'use client';

import { useState, useEffect } from 'react';
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
import { sendTestMessage } from '@/app/actions/whatsapp';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});

type FormData = z.infer<typeof formSchema>;

export default function WhatsappTestPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const onTestSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formattedNumber = data.phoneNumber.startsWith('0') ? `62${data.phoneNumber.substring(1)}` : data.phoneNumber;
      await sendTestMessage(formattedNumber, data.message);
      toast({ title: 'Pesan Terkirim!', description: `Pesan tes berhasil dikirim ke ${formattedNumber}` });
      reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim', description: (error as Error).message });
    } finally {
      setLoading(false);
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
      
      <Card>
        <CardHeader>
          <CardTitle>Uji Kirim Pesan</CardTitle>
          <CardDescription>Verifikasi koneksi dengan API SatuConnect dengan mengirim pesan tes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onTestSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Nomor Telepon Tujuan</Label>
              <Input id="phoneNumber" type="tel" {...register('phoneNumber')} placeholder="Contoh: 081234567890" />
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Isi Pesan</Label>
              <Textarea id="message" {...register('message')} placeholder="Ini adalah pesan tes dari Garda Lestari."/>
              {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Kirim Pesan Tes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
