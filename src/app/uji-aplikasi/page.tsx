
'use client';

import { useState } from 'react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, TestTube2, Send } from 'lucide-react';
import { submitTesterApplication } from '@/app/actions/app-testers';

const formSchema = z.object({
  name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
});

type FormData = z.infer<typeof formSchema>;

export default function AppTesterPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await submitTesterApplication(data);
      toast({
        title: 'Aplikasi Terkirim!',
        description: 'Terima kasih telah mendaftar. Kami akan meninjau aplikasi Anda.',
      });
      setIsSubmitted(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Aplikasi',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-16 max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <TestTube2 className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="font-headline text-3xl font-bold">Program Penguji Aplikasi</h1>
            <p className="text-muted-foreground mt-2">
              Jadilah orang pertama yang mencoba fitur-fitur terbaru dan bantu kami membangun aplikasi yang lebih baik.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formulir Pendaftaran</CardTitle>
              <CardDescription>
                Isi formulir di bawah ini untuk bergabung dengan program beta tester kami.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-10">
                  <h3 className="text-lg font-semibold">Terima Kasih!</h3>
                  <p className="text-muted-foreground">
                    Aplikasi Anda telah kami terima. Jika disetujui, Anda akan menerima notifikasi lebih lanjut.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email (terhubung dengan Play Store)</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Alasan Bergabung</Label>
                    <Textarea
                      id="reason"
                      {...register('reason')}
                      placeholder="Ceritakan mengapa Anda tertarik untuk menjadi penguji aplikasi kami..."
                    />
                    {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Kirim Aplikasi
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
