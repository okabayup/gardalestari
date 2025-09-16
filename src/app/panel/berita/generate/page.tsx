
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { createBeritaPost, BeritaPost } from '@/app/actions/berita';
import { useAuth } from '@/hooks/use-auth';
import { generateNewsArticle, NewsGeneratorOutput } from '@/ai/flows/news-generator-flow';
import RichTextEditor from '@/components/panel/RichTextEditor';
import Image from 'next/image';

interface GenerateForm {
  topic: string;
  description: string;
}

export default function GenerateBeritaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<NewsGeneratorOutput | null>(null);
  const [userImages, setUserImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit } = useForm<GenerateForm>();

  const generateSlug = (title: string) => {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setUserImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setUserImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
    });
  }

  const onGenerate = async (data: GenerateForm) => {
    setLoading(true);
    setGeneratedContent(null);
    toast({ title: 'AI sedang bekerja...', description: 'Mohon tunggu, ini mungkin memakan waktu hingga satu menit.' });

    try {
        const formData = new FormData();
        formData.append('topic', data.topic);
        formData.append('description', data.description);
        userImages.forEach(file => {
            formData.append('userImages', file);
        });

      const articleResult = await generateNewsArticle(formData);
      setGeneratedContent(articleResult);
      toast({ title: 'Berita dan gambar berhasil dibuat!', description: 'Silakan tinjau dan simpan.' });
    } catch (error) {
      console.error("Error during news generation:", error);
      toast({ variant: 'destructive', title: 'Gagal membuat berita', description: (error as Error).message, duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!generatedContent || !user) {
        toast({ variant: 'destructive', title: 'Konten belum dibuat', description: 'Silakan generate berita terlebih dahulu sebelum menyimpan.' });
        return;
    }
    setLoading(true);

    try {
      const newPost: Omit<BeritaPost, 'id' | 'type' | 'youtubeId' | 'isFeatured'> = {
        title: generatedContent.title || 'Judul Dibuat AI',
        slug: generateSlug(generatedContent.title || 'judul-dibuat-ai'),
        author: user?.displayName || 'Admin',
        date: new Date().toISOString(),
        imageUrl: generatedContent.coverImageUrl || '',
        imageHint: generatedContent.imageHints?.[0] || 'AI generated image',
        content: generatedContent.content || '<p>Konten tidak dapat dibuat.</p>',
        excerpt: generatedContent.excerpt || 'Ringkasan singkat...',
        category: generatedContent.category || 'Umum',
        status: 'published',
      };
      
      await createBeritaPost({ ...newPost, type: 'artikel' });

      toast({
        title: 'Berita Disimpan!',
        description: 'Berita baru telah berhasil disimpan dan dipublikasikan.',
      });
      router.push('/panel/berita');

    } catch (error) {
      console.error("Error saving news post:", error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan berita.',
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">News Full Generator</h1>
          <p className="text-muted-foreground">Buat draf berita lengkap dengan gambar hanya dengan satu klik.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/panel/berita')}>
          Kembali
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Input AI</CardTitle>
              <CardDescription>Berikan AI sedikit konteks untuk memulai.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topik Berita</Label>
                  <Input id="topic" {...register('topic')} placeholder="Contoh: Panen raya di desa X" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi & Konteks Tambahan</Label>
                  <Textarea id="description" {...register('description', { required: true })} rows={6} placeholder="Jelaskan poin-poin utama, sudut pandang, atau detail spesifik yang harus ada di dalam berita." />
                </div>
                 <div className="space-y-2">
                    <Label>Unggah Gambar (Opsional)</Label>
                    <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Pilih Gambar
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative">
                                    <Image src={src} alt="preview" width={80} height={80} className="w-20 h-20 object-cover rounded-md" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => removeImage(index)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {loading ? 'AI sedang menulis...' : 'Buat Berita'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hasil Generator</CardTitle>
              <CardDescription>Tinjau hasil di bawah ini. Anda dapat mengeditnya sebelum menyimpan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedContent ? (
                <>
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input value={generatedContent.title} onChange={(e) => setGeneratedContent(prev => prev ? {...prev, title: e.target.value} : null)} />
                  </div>
                   <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Input value={generatedContent.category} onChange={(e) => setGeneratedContent(prev => prev ? {...prev, category: e.target.value} : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Konten</Label>
                    <RichTextEditor 
                      value={generatedContent.content} 
                      onChange={(value) => setGeneratedContent(prev => prev ? {...prev, content: value} : null)}
                    />
                  </div>
                  <Button onClick={onSave} disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan & Publikasikan Berita
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg min-h-[300px]">
                  <Sparkles className="h-12 w-12 mb-4" />
                  <p>Hasil berita yang dibuat oleh AI akan muncul di sini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
