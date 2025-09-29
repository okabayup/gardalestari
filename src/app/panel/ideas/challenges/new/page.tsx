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
import { createChallenge } from '@/app/actions/ideas';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { Challenge } from '@/lib/definitions';

const formSchema = z.object({
  title: z.string().min(10, 'Judul minimal 10 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  criteria: z.string().min(10, 'Kriteria minimal 10 karakter'),
  reward: z.string().optional(),
  deadline: z.date({ required_error: 'Batas waktu wajib diisi' }),
});

type FormData = Omit<Challenge, 'id' | 'createdAt' | 'authorId' | 'deadline'> & { deadline: Date };

export default function NewChallengePage() {
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
        toast({ variant: 'destructive', title: 'Anda harus masuk untuk membuat tantangan' });
        return;
    }
    setLoading(true);
    try {
      await createChallenge(data, user.uid);
      toast({ title: 'Tantangan berhasil dibuat!' });
      router.push('/panel/ideas/challenges');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat tantangan', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <Button type="submit" form="challenge-form" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Tantangan
        </Button>
      </div>
      <form id="challenge-form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Buat Tantangan Baru</CardTitle>
            <CardDescription>Ajak anggota untuk memecahkan masalah spesifik dengan mengajukan solusi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Tantangan</Label>
              <Input id="title" {...register('title')} placeholder="Contoh: Mengurangi Sampah Plastik di Pesisir" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Latar Belakang</Label>
              <Textarea id="description" {...register('description')} placeholder="Jelaskan masalah atau konteks dari tantangan ini." />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">Kriteria Solusi yang Diharapkan</Label>
              <Textarea id="criteria" {...register('criteria')} placeholder="Jelaskan seperti apa solusi yang ideal. (Contoh: Berbasis teknologi, melibatkan komunitas, berkelanjutan, dll.)" />
              {errors.criteria && <p className="text-sm text-destructive">{errors.criteria.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="reward">Hadiah / Insentif (Opsional)</Label>
                    <Input id="reward" {...register('reward')} placeholder="Contoh: Dana awal Rp 5.000.000" />
                </div>
                <div className="space-y-2">
                    <Label>Batas Waktu Pengumpulan Solusi</Label>
                    <Controller
                        name="deadline"
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
                    {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
                </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}