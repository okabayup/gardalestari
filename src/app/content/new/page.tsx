
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, ArrowRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { createBeritaPost, BeritaPost } from '@/app/actions/berita';
import { getBeritaCategories, BeritaCategory } from '@/app/actions/berita-kategori';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/panel/RichTextEditor';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Switch } from '@/components/ui/switch';

type FormData = Omit<BeritaPost, 'id' | 'author' | 'date' | 'excerpt' | 'status' | 'type' | 'youtubeId' | 'isFeatured' | 'seoScore' >;

export default function SubmitContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BeritaCategory[]>([]);

  const { register, handleSubmit, reset, setValue, control, watch } = useForm<FormData>();
  
  React.useEffect(() => {
    getBeritaCategories().then(setCategories);
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    setValue('slug', generateSlug(newTitle));
  };
  
  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus login' });
        return;
    }
    setLoading(true);

    const postData: Omit<BeritaPost, 'id'> = {
        ...data,
        author: user.displayName || 'Kontributor',
        date: new Date().toISOString(),
        excerpt: data.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
        status: 'draft',
        type: 'artikel',
        isFeatured: false,
        seoScore: 0,
    };

    try {
      await createBeritaPost(postData);
      toast({
        title: 'Konten Terkirim!',
        description: 'Terima kasih atas kontribusi Anda. Tim editor akan meninjaunya.',
      });
      router.push('/feed');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Konten',
        description: (error as Error).message,
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <MainLayout>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="font-headline text-2xl font-bold">Kirim Konten</h1>
            <p className="text-muted-foreground">Bagikan tulisan atau laporan Anda dari lapangan.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                Batal
                </Button>
                <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim untuk Ditinjau
                </Button>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Editor Konten</CardTitle>
                <CardDescription>Tulis draf artikel Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Judul</Label>
                    <Input id="title" placeholder="Judul yang menarik..." {...register('title', { required: true })} onChange={handleTitleChange} />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input id="slug" placeholder="contoh: berita-keren-saya" {...register('slug')} />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL Gambar Utama</Label>
                    <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">Konten Artikel</Label>
                    <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Controller
                        name="category"
                        control={control}
                        rules={{ required: 'Kategori harus dipilih' }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
        </form>
    </MainLayout>
  );
}
