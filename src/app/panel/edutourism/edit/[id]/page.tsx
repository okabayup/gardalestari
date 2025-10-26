'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { getEduwisataPackage, updateEduwisataPackage, getAddons } from '@/app/actions/edutourism';
import type { Addon, EduwisataPackage } from '@/lib/definitions';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  minParticipants: z.coerce.number().min(1, 'Minimal peserta adalah 1'),
  duration: z.string().min(1, 'Durasi wajib diisi'),
  availableAddonIds: z.array(z.string()).optional(),
  imageFile: z.any().optional(),
  galleryFiles: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditEduwisataPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [initialPackageData, setInitialPackageData] = useState<EduwisataPackage | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const watchImageFile = watch('imageFile');
  const watchGalleryFiles = watch('galleryFiles');

  useEffect(() => {
    if (watchImageFile && watchImageFile.length > 0) {
      setImagePreview(URL.createObjectURL(watchImageFile[0]));
    }
  }, [watchImageFile]);
  
  useEffect(() => {
    if (watchGalleryFiles && watchGalleryFiles.length > 0) {
      const urls = Array.from(watchGalleryFiles).map((file: any) => URL.createObjectURL(file as Blob));
      setGalleryPreviews(prev => [...(initialPackageData?.images || []), ...urls]);
    }
  }, [watchGalleryFiles, initialPackageData]);

  useEffect(() => {
    async function fetchData() {
      setPageLoading(true);
      try {
        const [pkg, addons] = await Promise.all([
          getEduwisataPackage(id),
          getAddons(),
        ]);

        if (pkg) {
          reset(pkg);
          setInitialPackageData(pkg);
          setAllAddons(addons);
          setImagePreview(pkg.imageUrl);
          setGalleryPreviews(pkg.images || []);
        } else {
          toast({ variant: 'destructive', title: 'Paket tidak ditemukan' });
          router.push('/panel/edutourism');
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'Gagal memuat data' });
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, [id, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('price', String(data.price));
        formData.append('minParticipants', String(data.minParticipants));
        formData.append('duration', data.duration);
        formData.append('availableAddonIds', (data.availableAddonIds || []).join(','));
        
        if (data.imageFile && data.imageFile.length > 0) {
            formData.append('imageFile', data.imageFile[0]);
        }
        if (data.galleryFiles && data.galleryFiles.length > 0) {
             for (const file of Array.from(data.galleryFiles)) {
                formData.append('galleryFiles', file as Blob);
            }
        }
        
      await updateEduwisataPackage(id, formData);
      toast({ title: 'Paket berhasil diperbarui!' });
      router.push('/panel/edutourism');
    } catch (error) {
      console.error("[onSubmit Error]", "Failed to update package. Full error:", error);
      toast({ variant: 'destructive', title: 'Gagal memperbarui', description: (error as Error).message });
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Edit Paket Eduwisata</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/edutourism')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input id="price" type="number" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="minParticipants">Minimal Peserta</Label>
              <Input id="minParticipants" type="number" {...register('minParticipants')} />
              {errors.minParticipants && <p className="text-sm text-destructive">{errors.minParticipants.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi</Label>
              <Input id="duration" {...register('duration')} placeholder="Contoh: 3 Jam, 1 Hari" />
              {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gambar Utama (kosongkan jika tidak ingin mengubah)</Label>
            {imagePreview && <Image src={imagePreview} alt="Preview" width={200} height={125} className="rounded-md object-cover border" />}
            <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
          </div>
          <div className="space-y-2">
            <Label>Galeri Gambar (tambahkan gambar baru)</Label>
            <div className="flex flex-wrap gap-2">
                 {galleryPreviews.map((src, i) => <Image key={i} src={src} alt="Gallery Preview" width={80} height={80} className="rounded-md object-cover border"/>)}
            </div>
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
