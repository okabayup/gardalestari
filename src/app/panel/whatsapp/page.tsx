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
import { sendTestMessage } from '@/app/actions/whatsapp';

const formSchema = z.object({
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});

type FormData = z.infer<typeof formSchema>;

export default function WhatsappTestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Format number to 62...
      const formattedNumber = data.phoneNumber.startsWith('0') ? `62${data.phoneNumber.substring(1)}` : data.phoneNumber;
      const result = await sendTestMessage(formattedNumber, data.message);
      if (result.success) {
        toast({ title: 'Pesan Terkirim!', description: `Pesan tes berhasil dikirim ke ${formattedNumber}` });
        reset();
      } else {
        throw new Error("Gagal mengirim pesan.");
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Uji Kirim Pesan WhatsApp</h1>
        <p className="text-muted-foreground">Verifikasi koneksi dengan API SatuConnect dengan mengirim pesan tes.</p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Formulir Tes</CardTitle>
          <CardDescription>Masukkan nomor tujuan dan pesan yang ingin dikirim.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
