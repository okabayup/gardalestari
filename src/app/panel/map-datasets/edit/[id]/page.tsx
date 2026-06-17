
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { getMapDataset, updateMapDataset } from '@/app/actions/map-datasets';

const formSchema = z.object({
  name: z.string().min(1, 'Nama dataset wajib diisi'),
  url: z.string().url('URL GeoJSON tidak valid'),
  isVisible: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function EditMapDatasetPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });


  useEffect(() => {
    if (id) {
        getMapDataset(id).then(data => {
            if (data) {
                reset(data);
            } else {
                 toast({ variant: 'destructive', title: 'Dataset tidak ditemukan' });
                 router.push('/panel/map-datasets');
            }
        }).finally(() => setPageLoading(false));
    }
  }, [id, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateMapDataset(id, data);
      toast({ title: 'Dataset peta berhasil diperbarui!' });
      router.push('/panel/map-datasets');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui dataset', description: (error as Error).message });
      setLoading(false);
    }
  };
  
  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Edit Dataset Peta</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/map-datasets')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Detail Dataset</CardTitle>
            <CardDescription>Perbarui URL atau visibilitas dataset GeoJSON.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Dataset</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL GeoJSON</Label>
            <Input id="url" type="url" {...register('url')} />
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
              <Label htmlFor="isVisible">Terlihat di peta</Label>
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
