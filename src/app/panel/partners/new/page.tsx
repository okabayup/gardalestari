
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { createPartner, Partner } from '@/app/actions/partners';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  websiteUrl: z.string().url('URL website tidak valid'),
  logoUrl: z.string().url('URL logo wajib diisi'),
  isFeatured: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function NewPartnerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ 
      resolver: zodResolver(formSchema),
      defaultValues: {
          isFeatured: false,
          name: '',
          websiteUrl: '',
          logoUrl: ''
      }
  });

  const logoUrl = watch('logoUrl');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const partnerPayload: Omit<Partner, 'id'> = {
            ...data
        };
        await createPartner(partnerPayload);
        toast({ title: 'Mitra berhasil ditambahkan!' });
        router.push('/panel/partners');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menambahkan mitra', description: (error as Error).message });
    } finally {
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
            <Label htmlFor="logoUrl">URL Logo</Label>
            <Input id="logoUrl" type="url" {...register('logoUrl')} placeholder="https://example.com/logo.png" />
            {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
            {logoUrl && (
                <div className="mt-2">
                    <Image src={logoUrl} alt="Pratinjau logo" width={120} height={60} className="object-contain border p-2 rounded-md bg-white" />
                </div>
            )}
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
