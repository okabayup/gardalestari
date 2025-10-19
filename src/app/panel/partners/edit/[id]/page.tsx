
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
import { Loader2 } from 'lucide-react';
import { getPartner, updatePartner, updatePartnerWithUrl } from '@/app/actions/partners';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { PartnerCategory } from '@/lib/definitions';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  websiteUrl: z.string().url('URL website tidak valid'),
  category: z.enum(['strategis', 'media'], { required_error: 'Kategori wajib dipilih' }),
  isFeatured: z.boolean().default(false),
  logoSource: z.enum(['url', 'upload']).default('url'),
  logoUrl: z.string().optional(),
  logoFile: z.any().optional(),
}).refine(data => {
    if (data.logoSource === 'url') return !!data.logoUrl && z.string().url().safeParse(data.logoUrl).success;
    return true;
}, { message: 'URL Logo tidak valid', path: ['logoUrl'] });
// Note: We don't require logoFile on edit, as the user may not want to change it.

type FormData = z.infer<typeof formSchema>;

export default function EditPartnerPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const logoUrl = watch('logoUrl');
  const logoFile = watch('logoFile');
  const logoSource = watch('logoSource');

  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);

  const previewUrl = logoSource === 'url' 
    ? logoUrl 
    : logoFile?.[0] 
    ? URL.createObjectURL(logoFile[0]) 
    : initialLogoUrl;
  
  useEffect(() => {
    const fetchPartner = async () => {
      setPageLoading(true);
      try {
        const partner = await getPartner(partnerId);
        if (partner) {
          reset({
              ...partner,
              logoSource: 'url' // Default to URL for existing partners
          });
          setInitialLogoUrl(partner.logoUrl);
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
        if (data.logoSource === 'upload') {
            const { logoUrl, logoFile, ...rest } = data;
            await updatePartner(partnerId, rest, logoFile?.[0]);
        } else {
             const { logoFile, ...rest } = data;
             if (!rest.logoUrl) throw new Error("Logo URL is required");
             await updatePartnerWithUrl(partnerId, {
                 name: rest.name,
                 websiteUrl: rest.websiteUrl,
                 category: rest.category,
                 isFeatured: rest.isFeatured,
                 logoUrl: rest.logoUrl
             });
        }
        toast({ title: 'Mitra berhasil diperbarui!' });
        router.push('/panel/partners');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memperbarui mitra', description: (error as Error).message });
    } finally {
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
            <Label>Kategori Mitra</Label>
             <Controller name="category" control={control} render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="strategis" /> Mitra Strategis</Label>
                    <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="media" /> Mitra Media</Label>
                </RadioGroup>
            )} />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
           </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">URL Website</Label>
            <Input id="websiteUrl" type="url" {...register('websiteUrl')} />
            {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Sumber Logo</Label>
             <Controller name="logoSource" control={control} render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="upload" /> Unggah File</Label>
                    <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="url" /> Gunakan URL</Label>
                </RadioGroup>
            )} />
           </div>

            {logoSource === 'upload' && (
                <div className="space-y-2">
                    <Label htmlFor="logoFile">File Logo (Kosongkan jika tidak ingin mengubah)</Label>
                    <Input id="logoFile" type="file" {...register('logoFile')} accept="image/*" />
                    {errors.logoFile && <p className="text-sm text-destructive">{(errors.logoFile as any).message}</p>}
                </div>
            )}
            {logoSource === 'url' && (
                <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <Input id="logoUrl" type="url" {...register('logoUrl')} placeholder="https://example.com/logo.png" />
                    {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
                </div>
            )}
            
            {previewUrl && (
              <div className="mt-2">
                 <Image src={previewUrl} alt="Pratinjau logo" width={120} height={60} className="object-contain border p-2 rounded-md bg-white" />
              </div>
            )}

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
    