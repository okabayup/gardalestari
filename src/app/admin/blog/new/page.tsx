
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

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // Placeholder for actual form submission logic
    console.log('Form submitted');
    // In a real app, you would get form data and call a server action
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: 'Postingan Dibuat!',
      description: 'Postingan blog baru telah berhasil disimpan.',
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
            <CardTitle>Buat Postingan Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk membuat postingan blog baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Postingan</Label>
                <Input id="title" placeholder="Judul yang menarik..." />
              </div>
               <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" placeholder="contoh: postingan-baru-saya" />
                <p className="text-xs text-muted-foreground">Ini akan menjadi bagian dari URL. Gunakan huruf kecil, angka, dan tanda hubung.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Konten</Label>
                <Textarea id="content" placeholder="Tulis konten blog Anda di sini..." rows={15} />
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
