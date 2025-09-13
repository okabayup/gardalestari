
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
import { Loader2, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createMyAchievement } from '@/app/actions/achievements';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  imageFile: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewMyAchievementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus masuk untuk menambahkan prestasi.' });
        return;
    }
    setLoading(true);
    try {
      const { imageFile, ...achievementData } = data;
      const payload = { ...achievementData, date: Timestamp.fromDate(data.date) };
      await createMyAchievement(payload, user.uid, imageFile?.[0]);
      toast({ title: 'Prestasi berhasil ditambahkan!' });
      router.push('/profile/me');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
       <MainLayout>
         <div className="flex h-full items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </MainLayout>
     );
  }

  return (
    <MainLayout>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Prestasi
                </Button>
            </div>
        <Card>
            <CardHeader>
                <CardTitle>Tambah Prestasi Baru</CardTitle>
                <CardDescription>Bagikan pencapaian Anda kepada komunitas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Judul Prestasi</Label>
                <Input id="title" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" {...register('description')} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="imageFile">Gambar Bukti (Opsional)</Label>
                    <Input id="imageFile" type="file" {...register('imageFile')} />
                </div>
            </div>
            </CardContent>
        </Card>
        </form>
    </MainLayout>
  );
}
