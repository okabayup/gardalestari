
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { blogPosts } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';

export default function EditBlogPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Find the post by slug from placeholder data
  const post = blogPosts.find((p) => p.slug === params.slug);

  useEffect(() => {
    if (!post) {
      notFound();
    }
  }, [post]);

  if (!post) {
    return null; // or a loading/not-found component
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // Placeholder for actual form submission logic
    console.log('Form submitted for editing');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: 'Postingan Diperbarui!',
      description: 'Perubahan pada postingan blog telah disimpan.',
    });
    setLoading(false);
    router.push('/admin/blog');
  };

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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Postingan</Label>
                <Input id="title" defaultValue={post.title} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" defaultValue={post.slug} />
                 <p className="text-xs text-muted-foreground">Ini akan menjadi bagian dari URL. Gunakan huruf kecil, angka, dan tanda hubung.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Konten</Label>
                <Textarea id="content" defaultValue={post.content} rows={15} />
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
