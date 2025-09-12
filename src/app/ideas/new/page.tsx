
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
import { Loader2, ArrowLeft, Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createIdea, getIdeaCategories, IdeaCategory } from '@/app/actions/ideas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/MainLayout';

const formSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(100, 'Judul maksimal 100 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  category: z.string({ required_error: 'Kategori wajib dipilih' }),
});

type FormData = z.infer<typeof formSchema>;

export default function NewIdeaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });
  
  useEffect(() => {
    getIdeaCategories().then(setCategories);
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus masuk untuk mengajukan ide' });
        return;
    }
    setLoading(true);
    try {
      const ideaId = await createIdea(user.uid, data.title, data.description, data.category);
      toast({ title: 'Ide berhasil diajukan!', description: 'Terima kasih atas kontribusi Anda.' });
      router.push(`/ideas/${ideaId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mengajukan ide', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Bank Ide
        </Button>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Ajukan Ide Baru</CardTitle>
              <CardDescription>Bagikan gagasan cemerlang Anda untuk kemajuan organisasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Ide</Label>
                <Input id="title" {...register('title')} placeholder="Contoh: Program daur ulang sampah organik di tingkat DPC" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori Ide</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori yang paling sesuai" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                 {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Lengkap</Label>
                <Textarea id="description" {...register('description')} rows={8} placeholder="Jelaskan ide Anda secara rinci. Apa masalah yang ingin diselesaikan? Bagaimana solusinya? Siapa targetnya?"/>
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 flex justify-end">
             <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Lightbulb className="mr-2 h-4 w-4" />
                Kirim Ide
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
