
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getPartner, updatePartner, Partner } from '@/app/actions/partners';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

type FormData = Omit<Partner, 'id' | 'logoUrl'> & {
    logoFile?: FileList;
};

export default function EditPartnerPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const form = useForm<FormData>();

  useEffect(() => {
    if (!id) return;
    const fetchPartner = async () => {
      setPageLoading(true);
      try {
        const partner = await getPartner(id as string);
        if (!partner) {
          notFound();
          return;
        }
        form.reset(partner);
        setLogoPreview(partner.logoUrl);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat data mitra' });
      } finally {
        setPageLoading(false);
      }
    };
    fetchPartner();
  }, [id, form, toast]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setLoading(true);
    try {
      const { logoFile, ...partnerData } = data;
      await updatePartner(id as string, partnerData, logoFile?.[0]);
      toast({
        title: 'Mitra Diperbarui!',
        description: 'Data mitra telah berhasil diperbarui.',
      });
      router.push('/admin/partners');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui',
        description: (error as Error).message || 'Terjadi kesalahan.',
      });
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
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Mitra</CardTitle>
            <CardDescription>Perbarui detail mitra di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Mitra</Label>
                <Input id="name" {...form.register('name', { required: true })} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="websiteUrl">Situs Web Mitra</Label>
                <Input id="websiteUrl" type="url" {...form.register('websiteUrl', { required: true })} />
              </div>

              <FormField
                control={form.control}
                name="logoFile"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ganti Logo Mitra (Opsional)</FormLabel>
                        {logoPreview && (
                            <div className="w-48 p-4 border rounded-md">
                                <Image src={logoPreview} alt="Pratinjau logo" width={192} height={96} className="object-contain" />
                            </div>
                        )}
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handleLogoChange(e);
                                }}
                            />
                        </FormControl>
                    </FormItem>
                )}
              />

            <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Mitra Utama</FormLabel>
                        <p className="text-sm text-muted-foreground">
                         Aktifkan untuk menampilkan di halaman utama.
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/partners')}>
                    Batal
                </Button>
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
