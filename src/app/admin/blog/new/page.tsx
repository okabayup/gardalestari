
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
import { useForm } from 'react-hook-form';
import { createBlogPost, BlogPost } from '@/app/actions/blog';
import { useAuth } from '@/hooks/use-auth';

type FormData = Omit<BlogPost, 'id' | 'author' | 'date' | 'imageUrl' | 'imageHint' | 'excerpt'>;

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch } = useForm<FormData>();
  const titleValue = watch('title', '');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const newPost: Omit<BlogPost, 'id'> = {
            ...data,
            slug: data.slug || generateSlug(data.title),
            author: user?.displayName || 'Admin',
            date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            // Placeholder values, can be replaced by an upload feature later
            imageUrl: 'https://picsum.photos/id/1018/600/400',
            imageHint: 'mountain landscape',
            excerpt: data.content.substring(0, 150) + '...',
        };
        await createBlogPost(newPost);
        toast({
            title: 'Postingan Dibuat!',
            description: 'Postingan blog baru telah berhasil disimpan.',
        });
        router.push('/admin/blog');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menyimpan',
            description: (error as Error).message || 'Terjadi kesalahan saat menyimpan postingan.',
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
            <CardTitle>Buat Postingan Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk membuat postingan blog baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Postingan</Label>
                <Input id="title" placeholder="Judul yang menarik..." {...register('title', { required: true })} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" placeholder={generateSlug(titleValue) || 'contoh: postingan-baru-saya'} {...register('slug')} />
                <p className="text-xs text-muted-foreground">URL unik untuk postingan. Jika dikosongkan, akan dibuat otomatis dari judul.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Konten (mendukung HTML)</Label>
                <Textarea id="content" placeholder="Tulis konten blog Anda di sini. Anda bisa menggunakan tag HTML seperti <p>, <ul>, <li>, <h4>, dll." rows={15} {...register('content', { required: true })}/>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/blog')}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Postingan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
