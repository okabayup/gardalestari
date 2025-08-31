
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { getProgram, updateProgram, Program } from '@/app/actions/programs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type FormData = Omit<Program, 'id'>;

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { register, handleSubmit, reset, control } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProgram = async () => {
      setPageLoading(true);
      const fetchedProgram = await getProgram(id as string);
      if (!fetchedProgram) {
        notFound();
      } else {
        reset(fetchedProgram); // Populate form with fetched data
      }
      setPageLoading(false);
    };
    fetchProgram();
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setLoading(true);
    
    try {
      await updateProgram(id as string, data);
      toast({
        title: 'Program Diperbarui!',
        description: 'Perubahan pada program telah disimpan.',
      });
      router.push('/admin/programs');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Program</CardTitle>
            <CardDescription>Perbarui detail program di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="title">Nama Program</Label>
                <Input id="title" {...register('title', { required: true })} />
              </div>

               <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
                <Label htmlFor="imageUrl">URL Gambar</Label>
                <Input id="imageUrl" {...register('imageUrl')} />
              </div>

               <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar untuk AI</Label>
                <Input id="imageHint" {...register('imageHint')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" rows={5} {...register('description', { required: true })}/>
              </div>
               <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/programs')}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
