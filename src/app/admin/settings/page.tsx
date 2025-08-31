
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAppSettings, updateAppSettings, AppSettings } from '@/app/actions/settings';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  linkedin: z.string().url().or(z.literal('')),
  instagram: z.string().url().or(z.literal('')),
  twitter: z.string().url().or(z.literal('')),
  facebook: z.string().url().or(z.literal('')),
  isRegistrationOpen: z.boolean(),
});

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<AppSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkedin: '',
      instagram: '',
      twitter: '',
      facebook: '',
      isRegistrationOpen: true,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setPageLoading(true);
      const settings = await getAppSettings();
      form.reset(settings);
      setPageLoading(false);
    };
    fetchSettings();
  }, [form]);

  const onSubmit = async (data: AppSettings) => {
    setLoading(true);
    try {
      await updateAppSettings(data);
      toast({
        title: 'Pengaturan Disimpan!',
        description: 'Pengaturan aplikasi telah berhasil diperbarui.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan pengaturan.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali ke Dasbor
        </Button>
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <CardHeader>
                <CardTitle>Pengaturan Aplikasi</CardTitle>
                <CardDescription>Kelola pengaturan umum untuk aplikasi Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {/* Registration Settings */}
                <div>
                  <h3 className="text-lg font-medium">Pendaftaran Anggota</h3>
                  <p className="text-sm text-muted-foreground">Kontrol apakah pengguna baru dapat mendaftar.</p>
                </div>
                <FormField
                    control={form.control}
                    name="isRegistrationOpen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Buka Pendaftaran</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Jika aktif, pengguna baru dapat membuat akun.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                
                <Separator />

                {/* Social Media Settings */}
                <div>
                  <h3 className="text-lg font-medium">Media Sosial</h3>
                  <p className="text-sm text-muted-foreground">Kelola tautan media sosial yang ditampilkan di halaman utama.</p>
                </div>
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/company/nama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/nama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter (X) URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://x.com/nama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/nama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
