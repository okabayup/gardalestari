
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { getBeritaPost, updateBeritaPost, BeritaPost } from '@/app/actions/berita';
import { enhanceText, EnhanceTextOutput } from '@/ai/flows/enhance-text-flow';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getBeritaCategories, BeritaCategory } from '@/app/actions/berita-kategori';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/panel/RichTextEditor';

type FormData = Omit<BeritaPost, 'id' | 'author' | 'date' | 'excerpt'>;

const AnalysisPanel = ({ analysis }: { analysis: EnhanceTextOutput | null }) => {
  if (!analysis) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg h-full flex flex-col justify-center">
        <Sparkles className="mx-auto h-8 w-8 mb-2" />
        Jalankan "Sempurnakan dengan AI" untuk melihat analisis SEO dan Etika Pers.
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Analisis AI</CardTitle>
        <CardDescription>Hasil analisis dari asisten editor AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="font-semibold text-sm mb-1">Ringkasan</h4>
            <p className="text-xs text-muted-foreground">{analysis.summary}</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>Skor SEO: {analysis.seoScore}/100</Label>
          <Progress value={analysis.seoScore} className="h-2 [&>div]:bg-sky-500" />
          <p className="text-xs text-muted-foreground">{analysis.seoFeedback}</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>Skor Etika Pers: {analysis.ethicsScore}/100</Label>
          <Progress value={analysis.ethicsScore} className="h-2 [&>div]:bg-emerald-500" />
           <p className="text-xs text-muted-foreground">{analysis.ethicsFeedback}</p>
        </div>
      </CardContent>
    </Card>
  );
};


export default function EditBeritaPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState<BeritaPost | null>(null);
  const [categories, setCategories] = useState<BeritaCategory[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<EnhanceTextOutput | null>(null);

  const { register, handleSubmit, reset, setValue, getValues, control } = useForm<FormData>();

  useEffect(() => {
    const fetchPostAndCategories = async () => {
      setPageLoading(true);
      try {
        const [fetchedPost, fetchedCategories] = await Promise.all([
          getBeritaPost(params.slug),
          getBeritaCategories()
        ]);
        
        setCategories(fetchedCategories);

        if (!fetchedPost) {
          notFound();
        } else {
          setPost(fetchedPost);
          reset(fetchedPost);
        }
      } catch (error) {
         toast({ variant: 'destructive', title: 'Gagal memuat data' });
      } finally {
        setPageLoading(false);
      }
    };
    fetchPostAndCategories();
  }, [params.slug, reset, toast]);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    setValue('slug', generateSlug(newTitle));
  };
  
  const handleEnhanceWithAI = async () => {
    const content = getValues('content');
    if (!content.trim()) {
      toast({ variant: 'destructive', title: 'Konten kosong' });
      return;
    }
    setLoadingAi(true);
    try {
      const result = await enhanceText({ text: content });
      setAiAnalysis(result);
      setValue('title', result.suggestedTitle);
      setValue('slug', generateSlug(result.suggestedTitle));
      setValue('content', result.improvedText);
      toast({ title: 'Teks disempurnakan!', description: 'Konten telah diperbarui oleh AI.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: (error as Error).message });
    } finally {
      setLoadingAi(false);
    }
  };
  
  const handleGenerateImage = async () => {
      const imageHint = getValues('imageHint');
      if (!imageHint.trim()) {
          toast({ variant: 'destructive', title: 'Petunjuk gambar kosong' });
          return;
      }
      setLoadingImage(true);
      try {
          const result = await generateImage({ prompt: imageHint });
          if (result.imageUrl) {
              setValue('imageUrl', result.imageUrl);
              toast({ title: 'Gambar berhasil dibuat!' });
          } else {
              throw new Error("AI tidak mengembalikan URL gambar.");
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal membuat gambar', description: (error as Error).message });
      } finally {
          setLoadingImage(false);
      }
  };

  const onSubmit = async (data: FormData) => {
    if (!post || !post.id) return;
    setLoading(true);
    
    const updatedData: Partial<BeritaPost> = {
        ...data,
        excerpt: data.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
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
        description: (error as Error).message,
      });
    } finally {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Edit Berita Cerdas</h1>
          <p className="text-muted-foreground">Perbarui dan sempurnakan berita dengan bantuan AI.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/berita')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || loadingAi || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Konten Berita</CardTitle>
                    <CardDescription>Perbarui detail berita di bawah ini. Gunakan fitur AI untuk membantu Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Berita</Label>
                        <Input id="title" {...register('title', { required: true })} onChange={handleTitleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" {...register('slug', { required: true })} />
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
                                      <SelectValue placeholder="Pilih kategori berita" />
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
                     <div className="space-y-2">
                        <Label htmlFor="imageHint">Petunjuk Gambar (untuk AI)</Label>
                        <div className="flex gap-2">
                            <Input id="imageHint" {...register('imageHint')} />
                            <Button type="button" onClick={handleGenerateImage} disabled={loadingImage} className="whitespace-nowrap">
                                {loadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                                Buat
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL Gambar Utama</Label>
                        <Input id="imageUrl" {...register('imageUrl')} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="content">Konten Berita</Label>
                            <Button type="button" size="sm" variant="outline" onClick={handleEnhanceWithAI} disabled={loadingAi}>
                                {loadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Sempurnakan dengan AI
                            </Button>
                        </div>
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
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <AnalysisPanel analysis={aiAnalysis} />
        </div>
      </div>
    </form>
  );
}
