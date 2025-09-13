
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { suggestNewsTopics } from '@/ai/flows/news-generator-flow';

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

  const handleSuggestTopics = async () => {
    setGeneratingTopics(true);
    setSuggestions([]);
    try {
      const result = await suggestNewsTopics();
      setSuggestions(result.topics);
      toast({ title: 'Ide Topik Dihasilkan!', description: 'Pilih salah satu untuk dikembangkan menjadi artikel.' });
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
            <CardDescription>Pilih salah satu ide di bawah ini untuk dikembangkan di halaman generator.</CardDescription>
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
                    variant="outline"
                    onClick={() => handleUseTopic(topic)}
                  >
                    Gunakan Topik Ini
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
