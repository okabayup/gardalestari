
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
import { getSocialMediaLinks, updateSocialMediaLinks, SocialMediaLinks } from '@/app/actions/settings';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  linkedin: z.string().url().or(z.literal('')),
  instagram: z.string().url().or(z.literal('')),
  twitter: z.string().url().or(z.literal('')),
  facebook: z.string().url().or(z.literal('')),
});

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<SocialMediaLinks>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkedin: '',
      instagram: '',
      twitter: '',
      facebook: '',
    },
  });

  useEffect(() => {
    const fetchLinks = async () => {
      setPageLoading(true);
      const links = await getSocialMediaLinks();
      form.reset(links);
      setPageLoading(false);
    };
    fetchLinks();
  }, [form]);

  const onSubmit = async (data: SocialMediaLinks) => {
    setLoading(true);
    try {
      await updateSocialMediaLinks(data);
      toast({
        title: 'Pengaturan Disimpan!',
        description: 'Tautan media sosial telah berhasil diperbarui.',
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
          <CardHeader>
            <CardTitle>Pengaturan Media Sosial</CardTitle>
            <CardDescription>Kelola tautan media sosial yang ditampilkan di halaman utama.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
