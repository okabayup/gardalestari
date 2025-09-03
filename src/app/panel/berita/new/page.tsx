
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { createBeritaPost, BeritaPost } from '@/app/actions/berita';
import { useAuth } from '@/hooks/use-auth';
import { enhanceText, EnhanceTextOutput } from '@/ai/flows/enhance-text-flow';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { Progress } from '@/components/ui/progress';
import { marked } from 'marked';
import { Separator } from '@/components/ui/separator';
import { getBeritaCategories, BeritaCategory } from '@/app/actions/berita-kategori';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FormData = Omit<BeritaPost, 'id' | 'author' | 'date' | 'excerpt'>;

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [htmlValue, setHtmlValue] = useState(marked(value));

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerText); // Store as plain text/markdown
        }
    };
    
    // Update innerHTML when the value prop changes from outside
    const updateHtml = (markdownText: string) => {
      if (editorRef.current) {
        const newHtml = marked(markdownText);
        setHtmlValue(newHtml as string);
        editorRef.current.innerHTML = newHtml as string;
      }
    };
    
    // Expose updateHtml to parent
    React.useImperativeHandle(editorRef, () => ({
      ...editorRef.current,
      updateHtml,
    }));


    return (
        <div
            ref={editorRef}
            onInput={handleInput}
            contentEditable
            suppressContentEditableWarning
            className="prose dark:prose-invert min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            dangerouslySetInnerHTML={{ __html: htmlValue as string }}
        />
    );
};

const AnalysisPanel = ({ analysis }: { analysis: EnhanceTextOutput | null }) => {
  if (!analysis) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg h-full flex flex-col justify-center">
        <Sparkles className="mx-auto h-8 w-8 mb-2" />
        Jalankan "Sempurnakan dengan AI" untuk melihat analisis SEO dan Etika Pers.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score < 50) return 'bg-red-500';
    if (score < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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


export default function NewBeritaPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<EnhanceTextOutput | null>(null);
  const [categories, setCategories] = useState<BeritaCategory[]>([]);

  const { register, handleSubmit, watch, setValue, getValues, control } = useForm<FormData>({
    defaultValues: {
      title: '',
      slug: '',
      imageUrl: '',
      imageHint: '',
      content: '',
      category: ''
    }
  });

  const editorRef = useRef<{ updateHtml: (markdown: string) => void }>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const fetchedCategories = await getBeritaCategories();
      setCategories(fetchedCategories);
    };
    fetchCategories();
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    setValue('slug', generateSlug(newTitle));
  };
  
  const handleEnhanceWithAI = async () => {
    const content = getValues('content');
    if (!content.trim()) {
      toast({ variant: 'destructive', title: 'Konten kosong', description: 'Tulis sesuatu di editor sebelum menggunakan AI.' });
      return;
    }
    setLoadingAi(true);
    try {
      const result = await enhanceText({ text: content });
      setAiAnalysis(result);
      setValue('title', result.suggestedTitle);
      setValue('slug', generateSlug(result.suggestedTitle));
      setValue('content', result.improvedText);
      editorRef.current?.updateHtml(result.improvedText);
      toast({ title: 'Teks disempurnakan!', description: 'Konten, judul, dan analisis telah diperbarui oleh AI.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: (error as Error).message });
    } finally {
      setLoadingAi(false);
    }
  };
  
  const handleGenerateImage = async () => {
      const imageHint = getValues('imageHint');
      if (!imageHint.trim()) {
          toast({ variant: 'destructive', title: 'Petunjuk gambar kosong', description: 'Tulis deskripsi gambar yang ingin dibuat.' });
          return;
      }
      setLoadingImage(true);
      try {
          const result = await generateImage({ prompt: imageHint });
          if (result.imageUrl) {
              setValue('imageUrl', result.imageUrl);
              toast({ title: 'Gambar berhasil dibuat!', description: 'URL gambar telah ditambahkan.' });
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
    setLoading(true);
    try {
      const newPost: Omit<BeritaPost, 'id'> = {
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        author: user?.displayName || 'Admin',
        date: new Date().toISOString(),
        imageUrl: data.imageUrl,
        imageHint: data.imageHint,
        content: marked(data.content) as string, // Simpan sebagai HTML
        excerpt: data.content.substring(0, 150) + '...',
        category: data.category,
      };
      await createBeritaPost(newPost);
      toast({
        title: 'Berita Dibuat!',
        description: 'Berita baru telah berhasil disimpan.',
      });
      router.push('/panel/berita');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan berita.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Editor Berita Cerdas</h1>
          <p className="text-muted-foreground">Buat dan sempurnakan berita dengan bantuan AI.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/berita')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || loadingAi || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Berita
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Konten Berita</CardTitle>
                    <CardDescription>Isi detail berita di bawah ini. Gunakan fitur AI untuk membantu Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Berita</Label>
                        <Input id="title" placeholder="Judul yang menarik..." {...register('title', { required: true })} onChange={handleTitleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" placeholder="contoh: berita-baru-saya" {...register('slug')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Controller
                          name="category"
                          control={control}
                          rules={{ required: 'Kategori harus dipilih' }}
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Input id="imageHint" placeholder="Contoh: petani di sawah" {...register('imageHint')} />
                            <Button type="button" onClick={handleGenerateImage} disabled={loadingImage} className="whitespace-nowrap">
                                {loadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                                Buat
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL Gambar Utama</Label>
                        <Input id="imageUrl" placeholder="https://... atau generate dengan AI" {...register('imageUrl')} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="content">Konten Berita</Label>
                            <Button type="button" size="sm" variant="outline" onClick={handleEnhanceWithAI} disabled={loadingAi}>
                                {loadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Sempurnakan dengan AI
                            </Button>
                        </div>
                        <RichTextEditor
                            // @ts-ignore
                            ref={editorRef}
                            value={getValues('content')}
                            onChange={(newContent) => setValue('content', newContent)}
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

    