

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter, notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getBeritaPost, updateBeritaPost, BeritaPost } from '@/app/actions/berita';

type FormData = Omit<BeritaPost, 'id' | 'author' | 'date' | 'excerpt'>;

export default function EditBeritaPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [post, setPost] = useState<BeritaPost | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setPageLoading(true);
      const fetchedPost = await getBeritaPost(params.slug);
      if (!fetchedPost) {
        notFound();
      } else {
        setPost(fetchedPost);
        reset(fetchedPost); // Populate form with fetched data
      }
      setPageLoading(false);
    };
    fetchPost();
  }, [params.slug, reset]);

  const onSubmit = async (data: FormData) => {
    if (!post || !post.id) return;
    setLoading(true);
    
    // Ensure content update also updates excerpt
    const updatedData = {
        ...data,
        excerpt: data.content.substring(0, 150) + '...'
    };

    try {
      await updateBeritaPost(post.id, updatedData);
      toast({
        title: 'Berita Diperbarui!',
        description: 'Perubahan pada berita telah disimpan.',
      });
      router.push('/panel/berita');
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
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (!post) {
    return null; 
  }

  return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-bold">Edit Berita</h1>
            <Button variant="outline" onClick={() => router.back()}>
            Kembali
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Edit Berita</CardTitle>
            <CardDescription>Perbarui detail berita Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Berita</Label>
                <Input id="title" {...register('title', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register('slug', { required: true })} />
                <p className="text-xs text-muted-foreground">Ini akan menjadi bagian dari URL. Gunakan huruf kecil, angka, dan tanda hubung.</p>
              </div>
               <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar</Label>
                <Input id="imageUrl" {...register('imageUrl')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar (untuk AI)</Label>
                <Input id="imageHint" {...register('imageHint')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Konten (mendukung HTML)</Label>
                <Textarea id="content" rows={15} {...register('content', { required: true })} />
              </div>
               <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/panel/berita')}>
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
  );
}
