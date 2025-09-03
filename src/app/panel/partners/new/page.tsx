
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { createPartner } from '@/app/actions/partners';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  websiteUrl: z.string().url('URL website tidak valid'),
  logo: z.any().refine(files => files?.length === 1, "Logo wajib diunggah."),
  isFeatured: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function NewPartnerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const logoFile = watch('logo');
  
  if (logoFile && logoFile[0] && typeof logoFile[0] !== 'string') {
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(logoFile[0]);
  }


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(data.logo[0]);
    reader.onload = async () => {
        try {
            const logoDataUrl = reader.result as string;
            const partnerPayload = {
                name: data.name,
                websiteUrl: data.websiteUrl,
                isFeatured: data.isFeatured,
            };
            await createPartner(partnerPayload, logoDataUrl);
            toast({ title: 'Mitra berhasil ditambahkan!' });
            router.push('/panel/partners');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal menambahkan mitra', description: (error as Error).message });
            setLoading(false);
        }
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Gagal membaca file logo' });
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Tambah Mitra Baru</h1>
          <p className="text-muted-foreground">Isi detail di bawah ini.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/partners')}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Mitra
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
            <Label htmlFor="logo">Logo Mitra</Label>
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
