
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { suggestNewsTopics, generateNewsArticle } from '@/ai/flows/news-generator-flow';
import { createBeritaPost, BeritaPost } from '@/app/actions/berita';

interface TopicSuggestion {
  title: string;
  description: string;
  keywords: string[];
}

export default function NewsroomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generatingArticle, setGeneratingArticle] = useState<string | null>(null);

  const handleSuggestTopics = async () => {
    setGeneratingTopics(true);
    setSuggestions([]);
    try {
      const result = await suggestNewsTopics();
      setSuggestions(result.topics);
      toast({ title: 'Ide Topik Dihasilkan!', description: 'Pilih salah satu untuk dibuat menjadi artikel.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Membuat Ide', description: (error as Error).message });
    } finally {
      setGeneratingTopics(false);
    }
  };
  
  const handleGenerateArticle = async (topic: TopicSuggestion) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus login' });
        return;
    }
    setGeneratingArticle(topic.title);
    toast({ title: 'AI sedang menulis artikel...', description: 'Ini mungkin butuh waktu hingga satu menit. Mohon jangan tutup halaman ini.' });
    
    try {
        const articleResult = await generateNewsArticle({ topic: topic.title, description: topic.description });
        
        const newPost: Omit<BeritaPost, 'id'> = {
            title: articleResult.title,
            slug: articleResult.title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'),
            author: user.displayName || 'Admin',
            date: new Date().toISOString(),
            imageUrl: articleResult.coverImageUrl,
            imageHint: articleResult.imageHints?.[0] || 'AI generated image',
            content: articleResult.content,
            excerpt: articleResult.excerpt,
            category: articleResult.category,
            type: 'artikel',
            isFeatured: false,
        };

        const createdPost = await createBeritaPost(newPost);
        
        toast({
            title: 'Artikel Berhasil Dibuat & Disimpan!',
            description: `Artikel "${createdPost.title}" telah dipublikasikan.`,
            action: <Button variant="outline" size="sm" onClick={() => router.push(`/panel/berita/edit/${createdPost.slug}`)}>Edit</Button>
        });

        // Remove the generated topic from the list
        setSuggestions(prev => prev.filter(s => s.title !== topic.title));

    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal Membuat Artikel', description: (error as Error).message, duration: 8000 });
    } finally {
        setGeneratingArticle(null);
    }
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">AI Newsroom</h1>
          <p className="text-muted-foreground">Akselerasi pembuatan konten dengan ide topik berbasis SEO dari AI.</p>
        </div>
         <Button variant="outline" onClick={() => router.push('/panel/berita')}>
          Kembali ke Daftar Konten
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generator Ide Topik</CardTitle>
          <CardDescription>Minta AI untuk memberikan ide topik berita yang relevan dan memiliki potensi SEO yang baik berdasarkan tren saat ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSuggestTopics} disabled={generatingTopics}>
            {generatingTopics ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {generatingTopics ? 'Mencari Ide...' : 'Dapatkan 5 Ide Topik Baru'}
          </Button>
        </CardContent>
      </Card>
      
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Ide Topik</CardTitle>
            <CardDescription>Pilih salah satu ide di bawah ini untuk dibuat menjadi artikel lengkap oleh AI, termasuk gambar yang relevan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((topic, index) => (
              <Card key={index} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {topic.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                    </div>
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => handleGenerateArticle(topic)}
                    disabled={!!generatingArticle}
                  >
                    {generatingArticle === topic.title ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {generatingArticle === topic.title ? 'Membuat...' : 'Buat Artikel Ini'}
                  </Button>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {generatingTopics && (
         <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      )}

    </div>
  );
}
