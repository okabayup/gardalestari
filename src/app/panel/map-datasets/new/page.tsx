
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
import { Loader2 } from 'lucide-react';
import { createMapDataset } from '@/app/actions/map-datasets';

const formSchema = z.object({
  name: z.string().min(1, 'Nama dataset wajib diisi'),
  url: z.string().url('URL GeoJSON tidak valid'),
  isVisible: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function NewMapDatasetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ 
      resolver: zodResolver(formSchema),
      defaultValues: { isVisible: true }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createMapDataset(data);
      toast({ title: 'Dataset peta berhasil ditambahkan!' });
      router.push('/panel/map-datasets');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan dataset', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Tambah Dataset Peta Baru</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/map-datasets')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Dataset
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Detail Dataset</CardTitle>
            <CardDescription>Masukkan URL ke file GeoJSON publik.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Dataset</Label>
            <Input id="name" {...register('name')} placeholder="Contoh: Hotspot Kebakaran Hutan (NASA)" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL GeoJSON</Label>
            <Input id="url" type="url" {...register('url')} placeholder="https://firms.modaps.eosdis.nasa.gov/api/country/geojson/..." />
            {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>

          <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="isVisible"
                control={control}
                render={({ field }) => (
                  <Switch id="isVisible" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isVisible">Terlihat di peta secara default</Label>
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
