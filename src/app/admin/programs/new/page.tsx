
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { createProgram, Program } from '@/app/actions/programs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FormData = Omit<Program, 'id'>;

export default function NewProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, control } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const newProgram: Omit<Program, 'id'> = {
            ...data,
            // Use a placeholder image for now, can be replaced by an upload feature later
            imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title.replace(/\s+/g, '-')}/600/400`,
            imageHint: data.imageHint || 'program activity',
        };
        await createProgram(newProgram);
        toast({
            title: 'Program Dibuat!',
            description: 'Program baru telah berhasil disimpan.',
        });
        router.push('/admin/programs');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menyimpan',
            description: (error as Error).message || 'Terjadi kesalahan saat menyimpan program.',
        });
        setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Buat Program Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk membuat program kerja baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Nama Program</Label>
                <Input id="title" placeholder="Nama program yang jelas..." {...register('title', { required: true })} />
              </div>

               <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="flagship">Program Unggulan (Flagship)</SelectItem>
                            <SelectItem value="ongoing">Inisiatif Berkelanjutan (Ongoing)</SelectItem>
                        </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar (Opsional)</Label>
                <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
                 <p className="text-xs text-muted-foreground">Jika dikosongkan, gambar placeholder akan digunakan.</p>
              </div>

               <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar untuk AI (Opsional)</Label>
                <Input id="imageHint" placeholder="Contoh: youth planting trees" {...register('imageHint')} />
                 <p className="text-xs text-muted-foreground">Maksimal 2 kata. Digunakan jika URL gambar tidak diisi.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" placeholder="Jelaskan secara singkat tentang program ini..." rows={5} {...register('description', { required: true })}/>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/programs')}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Program
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
