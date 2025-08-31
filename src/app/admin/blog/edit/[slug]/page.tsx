
'use client';

import MainLayout from '@/components/layout/MainLayout';
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
import { getBlogPost, updateBlogPost, BlogPost } from '@/app/actions/blog';

type FormData = Omit<BlogPost, 'id' | 'author' | 'date' | 'excerpt'>;

export default function EditBlogPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setPageLoading(true);
      const fetchedPost = await getBlogPost(params.slug);
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
      await updateBlogPost(post.id, updatedData);
      toast({
        title: 'Postingan Diperbarui!',
        description: 'Perubahan pada postingan blog telah disimpan.',
      });
      router.push('/admin/blog');
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

  if (!post) {
    return null; 
  }

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Postingan</CardTitle>
            <CardDescription>Perbarui detail postingan blog Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Postingan</Label>
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
                <Button variant="outline" type="button" onClick={() => router.push('/admin/blog')}>
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
