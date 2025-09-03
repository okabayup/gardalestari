
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { getPartner, updatePartner } from '@/app/actions/partners';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  websiteUrl: z.string().url('URL website tidak valid'),
  logo: z.any().optional(),
  isFeatured: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function EditPartnerPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const logoFile = watch('logo');
  
  useEffect(() => {
    if (logoFile && logoFile[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(logoFile[0]);
    }
  }, [logoFile]);

  useEffect(() => {
    const fetchPartner = async () => {
      setPageLoading(true);
      try {
        const partner = await getPartner(partnerId);
        if (partner) {
          reset(partner);
          setLogoPreview(partner.logoUrl);
        } else {
          toast({ variant: 'destructive', title: 'Mitra tidak ditemukan' });
          router.push('/panel/partners');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat data mitra' });
      } finally {
        setPageLoading(false);
      }
    };
    fetchPartner();
  }, [partnerId, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const partnerPayload: Partial<Omit<FormData, 'logo'>> = {
            name: data.name,
            websiteUrl: data.websiteUrl,
            isFeatured: data.isFeatured,
        };

        let logoDataUrl: string | undefined;
        if (data.logo && data.logo[0]) {
            logoDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(data.logo[0]);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        }
        
        await updatePartner(partnerId, partnerPayload, logoDataUrl);
        toast({ title: 'Mitra berhasil diperbarui!' });
        router.push('/panel/partners');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memperbarui mitra', description: (error as Error).message });
        setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Edit Mitra</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/partners')}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Mitra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Mitra</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">URL Website</Label>
            <Input id="websiteUrl" type="url" {...register('websiteUrl')} />
            {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="logo">Ganti Logo Mitra</Label>
            {logoPreview ? (
                <Image src={logoPreview} alt="Logo preview" width={120} height={60} className="object-contain border p-2 rounded-md" />
            ) : (
                <div className="w-32 h-16 flex items-center justify-center bg-muted rounded-md">
                    <ImageIcon className="h-8 w-8 text-muted-foreground"/>
                </div>
            )}
            <Input id="logo" type="file" {...register('logo')} accept="image/png, image/jpeg, image/svg+xml" />
            {errors.logo && <p className="text-sm text-destructive">{(errors.logo as any).message}</p>}
          </div>
           <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isFeatured">Tampilkan di halaman utama</Label>
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
