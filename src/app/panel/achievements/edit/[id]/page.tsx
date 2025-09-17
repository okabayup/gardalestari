
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, User, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { getAchievement, updateAchievement } from '@/app/actions/achievements';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const formSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string(),
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  imageUrl: z.string().optional(),
  imageFile: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditAchievementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const imageFile = watch("imageFile");

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
        const url = URL.createObjectURL(imageFile[0]);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);


  useEffect(() => {
    if (id) {
        getAchievement(id).then(data => {
            if (data) {
                reset({ ...data, date: new Date(data.date) });
                if (data.imageUrl) {
                    setImagePreview(data.imageUrl);
                }
            } else {
                 toast({ variant: 'destructive', title: 'Prestasi tidak ditemukan' });
                 router.push('/panel/achievements');
            }
        }).finally(() => setPageLoading(false));
    }
  }, [id, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { imageFile, ...payload } = data;
      const achievementData = { ...payload, date: Timestamp.fromDate(data.date) };
      await updateAchievement(id, achievementData, imageFile?.[0]);
      toast({ title: 'Prestasi berhasil diperbarui!' });
      router.push('/panel/achievements');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui', description: (error as Error).message });
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Edit Prestasi</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/achievements')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Prestasi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Anggota</Label>
             <Input disabled value={watch('userName')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul Prestasi</Label>
            <Input id="title" {...register('title')} />
            {/* Error handling */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {/* Error handling */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Tanggal Prestasi</Label>
                <Controller
                name="date"
                control={control}
                render={({ field }) => (
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                    </Popover>
                )}
                />
                 {/* Error handling */}
            </div>
            <div className="space-y-2">
                <Label htmlFor="imageFile">Gambar Bukti (Opsional)</Label>
                <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
                {imagePreview && <Image src={imagePreview} alt="Bukti prestasi" width={100} height={100} className="mt-2 rounded-md object-cover" />}
                <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
            </div>
          </div>

        </CardContent>
      </Card>
    </form>
  );
}
