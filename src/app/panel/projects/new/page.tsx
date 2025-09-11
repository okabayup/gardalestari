
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { createProject } from '@/app/actions/projects';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  originIdeaId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });
  
  useEffect(() => {
    // Pre-fill form if creating from an idea
    const ideaId = searchParams.get('ideaId');
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    if (ideaId && title) {
        setValue('title', title);
        if (description) setValue('description', description);
        setValue('originIdeaId', ideaId);
    }
  }, [searchParams, setValue]);


  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus login untuk membuat proyek' });
        return;
    }
    setLoading(true);
    try {
      const projectId = await createProject(data, user.uid);
      toast({ title: 'Proyek berhasil dibuat!' });
      router.push(`/panel/projects/${projectId}`); // Redirect to the new project board
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat proyek', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Proyek Baru</h1>
          <p className="text-muted-foreground">Mulai kolaborasi dengan proyek baru.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/projects')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Proyek
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Detail Proyek</CardTitle>
            <CardDescription>Isi nama dan deskripsi singkat proyek Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nama Proyek</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea id="description" {...register('description')} rows={5} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
