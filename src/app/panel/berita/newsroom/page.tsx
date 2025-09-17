
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ArrowRight, PenSquare, Check, Circle } from 'lucide-react';
import { suggestNewsTopics } from '@/ai/flows/news-generator-flow';
import { bulkGenerateNewsDrafts } from '@/ai/flows/bulk-generate-flow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createGenerationJob } from '@/app/actions/berita';
import { Checkbox } from '@/components/ui/checkbox';

interface TopicSuggestion {
  title: string;
  description: string;
  keywords: string[];
}

export default function NewsroomPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<TopicSuggestion[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const handleSuggestTopics = async () => {
    setGeneratingTopics(true);
    setSuggestions([]);
    setSelectedTopics([]);
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
    if (selectedTopics.length === 0) {
      toast({ variant: 'destructive', title: 'Tidak ada topik terpilih' });
      return;
    }
    setIsBulkGenerating(true);
    toast({ title: 'Memulai Proses Massal...', description: `Agen AI akan membuat ${selectedTopics.length} draf artikel.` });

    try {
        const jobId = await createGenerationJob(selectedTopics.length);
        localStorage.setItem('activeGenerationJobId', jobId);

        // Don't await this, let it run in the background
        bulkGenerateNewsDrafts({ topics: selectedTopics, jobId });

        router.push('/panel/berita');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memulai proses massal', description: (error as Error).message });
        setIsBulkGenerating(false);
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
          <Button onClick={handleSuggestTopics} disabled={generatingTopics}>
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

      {generatingTopics && (
         <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      )}

    </div>
  );
}
