
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createMapData } from '@/app/actions/map-data';
import { categoryConfig } from '@/app/map/page';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  category: z.enum(['potensi', 'permasalahan', 'program', 'kegiatan', 'dana'], { required_error: 'Kategori wajib dipilih' }),
  latitude: z.coerce.number().min(-90, 'Latitude tidak valid').max(90, 'Latitude tidak valid'),
  longitude: z.coerce.number().min(-180, 'Longitude tidak valid').max(180, 'Longitude tidak valid'),
  budget: z.coerce.number().optional(),
  disbursed: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewMapDataPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const selectedCategory = watch('category');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createMapData(data);
      toast({ title: 'Data peta berhasil ditambahkan!' });
      router.push('/panel/map-data');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan data', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Tambah Data Peta Baru</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/map-data')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Data
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Detail Titik Data</CardTitle>
            <CardDescription>Isi informasi untuk titik data baru di peta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" {...register('title')} placeholder="Contoh: Potensi Perkebunan Kopi Gayo" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} placeholder="Deskripsi singkat mengenai titik data ini..." />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>Kategori</Label>
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(categoryConfig).map(([key, {label}]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="any" {...register('latitude')} placeholder="-6.2088" />
              {errors.latitude && <p className="text-sm text-destructive">{errors.latitude.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="any" {...register('longitude')} placeholder="106.8456" />
              {errors.longitude && <p className="text-sm text-destructive">{errors.longitude.message}</p>}
            </div>
          </div>
          
          {(selectedCategory === 'program' || selectedCategory === 'dana') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Anggaran (Rp)</Label>
                <Input id="budget" type="number" {...register('budget')} placeholder="50000000" />
                {errors.budget && <p className="text-sm text-destructive">{errors.budget.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="disbursed">Dana Tersalurkan (Rp)</Label>
                <Input id="disbursed" type="number" {...register('disbursed')} placeholder="15000000" />
                {errors.disbursed && <p className="text-sm text-destructive">{errors.disbursed.message}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
