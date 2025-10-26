
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
import { Loader2, Mail } from 'lucide-react';
import { sendTestEmail } from '@/app/actions/email';

const formSchema = z.object({
  to: z.string().email('Alamat email tidak valid'),
  subject: z.string().min(1, 'Subjek tidak boleh kosong'),
  text: z.string().min(1, 'Isi pesan tidak boleh kosong'),
});

type FormData = z.infer<typeof formSchema>;

export default function EmailManagementPage() {
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
      await sendTestEmail(data);
      toast({ title: 'Email Tes Terkirim!', description: `Email berhasil dikirim ke ${data.to}` });
      reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim Email', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Manajemen Email</h1>
        <p className="text-muted-foreground">Kirim email tes untuk memverifikasi konfigurasi SMTP.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kirim Email Tes</CardTitle>
          <CardDescription>Gunakan formulir ini untuk mengirim email dari notifikasi@gardalestari.org.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Penerima</Label>
              <Input id="to" type="email" {...register('to')} placeholder="alamat@email.com" />
              {errors.to && <p className="text-sm text-destructive">{errors.to.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input id="subject" {...register('subject')} placeholder="Ini adalah subjek email tes" />
              {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Isi Pesan (Teks)</Label>
              <Textarea id="text" {...register('text')} placeholder="Ini adalah isi pesan email..." />
              {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Kirim Email
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
