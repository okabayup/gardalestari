
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { createPartner, Partner } from '@/app/actions/partners';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

type FormData = Omit<Partner, 'id' | 'logoUrl'> & {
    logoFile: FileList;
};

export default function NewPartnerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const form = useForm<FormData>({
    defaultValues: {
        isFeatured: false,
    }
  });
  
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
    if (!data.logoFile || data.logoFile.length === 0) {
        toast({ variant: 'destructive', title: 'Logo dibutuhkan', description: 'Mohon unggah file logo.' });
        return;
    }

    setLoading(true);
    try {
        const { logoFile, ...partnerData } = data;
        await createPartner(partnerData, logoFile[0]);
        toast({
            title: 'Mitra Ditambahkan!',
            description: 'Mitra baru telah berhasil disimpan.',
        });
        router.push('/admin/partners');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menyimpan',
            description: (error as Error).message || 'Terjadi kesalahan saat menyimpan data mitra.',
        });
        setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Tambah Mitra Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk menambahkan mitra baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Mitra</Label>
                <Input id="name" placeholder="Nama perusahaan atau organisasi..." {...form.register('name', { required: true })} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="websiteUrl">Situs Web Mitra</Label>
                <Input id="websiteUrl" type="url" placeholder="https://..." {...form.register('websiteUrl', { required: true })} />
              </div>

              <FormField
                control={form.control}
                name="logoFile"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Logo Mitra</FormLabel>
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
                  Simpan Mitra
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
