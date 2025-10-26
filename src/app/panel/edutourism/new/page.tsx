
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, PlusCircle } from 'lucide-react';
import { createEduwisataPackage, getAddons } from '@/app/actions/edutourism';
import type { Addon } from '@/lib/definitions';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  duration: z.string().min(1, 'Durasi wajib diisi'),
  availableAddonIds: z.array(z.string()).optional(),
  imageFile: z.any().refine(files => files?.length > 0, 'Gambar utama wajib diunggah'),
  galleryFiles: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewEduwisataPackagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const watchImageFile = watch('imageFile');

  useEffect(() => {
    if (watchImageFile && watchImageFile.length > 0) {
      setImagePreview(URL.createObjectURL(watchImageFile[0]));
    }
  }, [watchImageFile]);
  
  useEffect(() => {
    getAddons().then(setAllAddons);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('duration', data.duration);
      if (data.availableAddonIds) {
        formData.append('availableAddonIds', data.availableAddonIds.join(','));
      }
      if (data.imageFile && data.imageFile.length > 0) {
        formData.append('imageFile', data.imageFile[0]);
      }
      if (data.galleryFiles && data.galleryFiles.length > 0) {
        for (const file of Array.from(data.galleryFiles)) {
          formData.append('galleryFiles', file as Blob);
        }
      }

      await createEduwisataPackage(formData);
      toast({ title: 'Paket baru berhasil ditambahkan!' });
      router.push('/panel/edutourism');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Tambah Paket Eduwisata Baru</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/edutourism')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Paket
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Paket</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nama Paket</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input id="price" type="number" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi</Label>
              <Input id="duration" {...register('duration')} placeholder="Contoh: 3 Jam, 1 Hari" />
              {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="imageFile">Gambar Utama</Label>
            {imagePreview && <Image src={imagePreview} alt="Preview" width={200} height={250} className="rounded-md object-cover border" />}
            <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
            {errors.imageFile && <p className="text-sm text-destructive">{(errors.imageFile as any).message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="galleryFiles">Galeri Gambar (Opsional)</Label>
            <Input id="galleryFiles" type="file" {...register('galleryFiles')} accept="image/*" multiple />
          </div>
          <div className="space-y-2">
            <Label>Add-ons Tersedia</Label>
            <Controller
              control={control}
              name="availableAddonIds"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 rounded-md border p-4">
                  {allAddons.map(addon => (
                    <div key={addon.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={addon.id}
                        checked={field.value?.includes(addon.id)}
                        onCheckedChange={checked => {
                          const newValue = checked
                            ? [...(field.value || []), addon.id]
                            : (field.value || []).filter(id => id !== addon.id);
                          field.onChange(newValue);
                        }}
                      />
                      <Label htmlFor={addon.id} className="cursor-pointer">{addon.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
