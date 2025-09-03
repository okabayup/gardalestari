
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
import { sendNotificationToAll } from '@/app/actions/notifications';

const notificationSchema = z.object({
  title: z.string().min(3, 'Judul harus memiliki setidaknya 3 karakter'),
  message: z.string().min(5, 'Pesan harus memiliki setidaknya 5 karakter'),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function NotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
  });

  const onSubmit = async (data: NotificationFormData) => {
    setLoading(true);
    try {
      const result = await sendNotificationToAll({
        title: data.title,
        body: data.message,
      });

      toast({
        title: 'Notifikasi Terkirim!',
        description: `Berhasil mengirim ke ${result.successCount} perangkat. Gagal: ${result.failureCount}.`,
      });
      reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Notifikasi',
        description: (error as Error).message || 'Terjadi kesalahan pada server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Manajemen Notifikasi</h1>
        <p className="text-muted-foreground">Kirim pesan dan pembaruan ke pengguna Anda.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buat Notifikasi Baru</CardTitle>
          <CardDescription>
            Tulis pesan yang ingin Anda kirim. Saat ini, notifikasi akan dikirim ke semua pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Notifikasi</Label>
              <Input
                id="title"
                placeholder="Contoh: Acara Baru Telah Tiba!"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Isi Pesan</Label>
              <Textarea
                id="message"
                placeholder="Jelaskan detail notifikasi di sini..."
                {...register('message')}
              />
              {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
