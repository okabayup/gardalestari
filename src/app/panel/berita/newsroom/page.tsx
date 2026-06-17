

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ArrowRight, PenSquare, Check, Circle, CheckCircle, XCircle } from 'lucide-react';
import { suggestNewsTopics } from '@/ai/flows/news-generator-flow';
import { createBeritaPost, createGenerationJob, updateJobProgress } from '@/app/actions/berita';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { generateNewsArticle } from '@/ai/flows/news-generator-flow';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { logAnalyticsEvent } from '@/lib/analytics';

interface TopicSuggestion {
  title: string;
  description: string;
  keywords: string[];
}

type TopicStatus = 'pending' | 'processing' | 'success' | 'failed';

interface ProcessingTopic extends TopicSuggestion {
    status: TopicStatus;
    result?: { id: string; slug: string; };
    error?: string;
}

export default function NewsroomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<TopicSuggestion[]>([]);
  const [processingTopics, setProcessingTopics] = useState<ProcessingTopic[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  useEffect(() => {
    // Pre-fill form from URL params if they exist
    const descriptionParam = searchParams.get('description');
    if (descriptionParam) {
        setDescription(descriptionParam);
    }
  }, [searchParams]);


  const handleSuggestTopics = async () => {
    setGeneratingTopics(true);
    setSuggestions([]);
    setSelectedTopics([]);
    setProcessingTopics([]);
    try {
      const result = await suggestNewsTopics({ description });
      setSuggestions(result.topics);
      toast({ title: 'Ide Topik Dihasilkan!', description: 'Pilih topik yang Anda sukai.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Membuat Ide', description: (error as Error).message });
    } finally {
      setGeneratingTopics(false);
    }
  };
  
  const handleUseTopic = (topic: TopicSuggestion) => {
    const params = new URLSearchParams({
      topic: topic.title,
      description: topic.description,
    });
    router.push(`/panel/berita/generate?${params.toString()}`);
  }

  const handleToggleTopicSelection = (topic: TopicSuggestion, checked: boolean) => {
    setSelectedTopics(prev => 
      checked ? [...prev, topic] : prev.filter(t => t.title !== topic.title)
    );
  }

  const handleBulkGenerate = async () => {
    if (selectedTopics.length === 0 || !user) {
      toast({ variant: 'destructive', title: 'Tidak ada topik terpilih atau pengguna tidak login' });
      return;
    }
    setIsBulkGenerating(true);
    setProcessingTopics(selectedTopics.map(t => ({ ...t, status: 'pending' })));

    let jobId: string;
    try {
        logAnalyticsEvent('create_bulk_job', { topic_count: selectedTopics.length });
        jobId = await createGenerationJob(selectedTopics.length);
        toast({ title: 'Memulai Proses Massal...', description: `Agen AI akan membuat ${selectedTopics.length} draf artikel.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal membuat tugas', description: (error as Error).message });
        setIsBulkGenerating(false);
        return;
    }
    

    for (let i = 0; i < selectedTopics.length; i++) {
        const topic = selectedTopics[i];

        setProcessingTopics(prev => prev.map((t, index) => index === i ? { ...t, status: 'processing' } : t));
        
        try {
            const formData = new FormData();
            formData.append('topic', topic.title);
            formData.append('description', topic.description);
            // No user images for bulk generation for simplicity

            const articleResult = await generateNewsArticle(formData);

            const newPost = await createBeritaPost({
                title: articleResult.title,
                slug: `draft-${Date.now()}-${articleResult.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`,
                content: articleResult.content,
                author: 'Garda Warta (AI)',
                date: new Date().toISOString(),
                imageUrl: articleResult.coverImageUrl,
                imageHint: articleResult.imageHints[0] || 'AI Generated',
                excerpt: articleResult.excerpt,
                category: articleResult.category,
                type: 'artikel',
                isFeatured: false,
                seoScore: 0,
                status: 'draft',
            });
            if (!newPost || !newPost.id) throw new Error("Gagal menyimpan draf ke database.");

            await updateJobProgress(jobId, 1);
            setProcessingTopics(prev => prev.map((t, index) => index === i ? { ...t, status: 'success', result: { id: newPost.id!, slug: newPost.slug } } : t));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
            await updateJobProgress(jobId, 1, { topic: topic.title, error: errorMessage });
            setProcessingTopics(prev => prev.map((t, index) => index === i ? { ...t, status: 'failed', error: errorMessage } : t));
        }
    }
    
    toast({ title: 'Proses Selesai!', description: 'Semua topik telah diproses. Periksa hasilnya di bawah.'});
    // Do not set isBulkGenerating to false to prevent re-running
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
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="description">Konteks atau Permintaan Spesifik (Opsional)</Label>
                <Textarea 
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: fokus pada dampak perubahan iklim di pesisir utara Jawa, atau cari topik yang cocok untuk Hari Tani Nasional."
                />
            </div>
          <Button onClick={handleSuggestTopics} disabled={generatingTopics || isBulkGenerating}>
            {generatingTopics ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {generatingTopics ? 'Mencari Ide...' : 'Dapatkan 5 Ide Topik Baru'}
          </Button>
        </CardContent>
      </Card>
      
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Hasil Ide Topik</CardTitle>
              <CardDescription>Pilih satu topik untuk dibuatkan draf tunggal, atau pilih beberapa untuk dibuatkan draf secara massal.</CardDescription>
            </div>
            <Button
                onClick={handleBulkGenerate}
                disabled={selectedTopics.length === 0 || isBulkGenerating}
            >
                {isBulkGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenSquare className="mr-2 h-4 w-4" />}
                Generate Draf ({selectedTopics.length})
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((topic, index) => (
              <Card key={index} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <Checkbox 
                            id={`topic-${index}`}
                            onCheckedChange={(checked) => handleToggleTopicSelection(topic, !!checked)}
                            className="mt-1"
                            disabled={isBulkGenerating}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor={`topic-${index}`} className="font-semibold cursor-pointer">{topic.title}</Label>
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                            <div className="flex flex-wrap gap-1">
                            {topic.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                            </div>
                        </div>
                    </div>
                  <Button
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseTopic(topic)}
                    disabled={isBulkGenerating}
                  >
                    Gunakan & Edit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {isBulkGenerating && processingTopics.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Proses Pembuatan Artikel Massal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {processingTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="flex-1">
                            <p className="font-medium">{topic.title}</p>
                            {topic.status === 'failed' && <p className="text-xs text-destructive">{topic.error}</p>}
                            {topic.status === 'success' && topic.result && (
                                <Link href={`/panel/berita/edit/${topic.result.slug}`} className="text-xs text-primary hover:underline">
                                    Berhasil! Klik untuk mengedit draf.
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {topic.status === 'pending' && <Circle className="h-4 w-4" />}
                            {topic.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                            {topic.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {topic.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                            <span>{topic.status.charAt(0).toUpperCase() + topic.status.slice(1)}</span>
                        </div>
                    </div>
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
