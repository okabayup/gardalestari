
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Link as LinkIcon, Lightbulb, UserCircle, Plus, Trash2, Paperclip, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { answerQuestion } from '@/ai/flows/assistant-flow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AssistantOutput, Citation } from '@/lib/definitions';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { produce } from 'immer';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';

const samplePrompts = [
    'Bagaimana cara mengajukan ide baru?',
    'Bantu saya membuat ide bisnis di sektor pertanian.',
    'Program apa saja yang sedang dibuka?',
    'Bagaimana cara melihat Kartu Tanda Anggota saya?',
];

interface Message {
  role: 'user' | 'assistant';
  content: any; // Can be string or array of parts for multimodal
  citations?: Citation[];
  audioUrl?: string;
  isVoiceInput?: boolean;
}

interface Thread {
    id: string;
    title: string;
    messages: Message[];
}

const CitationCard = ({ citation }: { citation: Citation }) => {
    return (
         <Card className="shadow-lg border-primary/20">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    {citation.type === 'data' ? <LinkIcon className="h-4 w-4"/> : <Lightbulb className="h-4 w-4"/>}
                    {citation.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{citation.summary}</p>
                 <Button asChild size="sm" className="w-full">
                    <Link href={citation.url} target="_blank">Lihat Detail</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

const RenderMessage = ({ message }: { message: Message }) => {
    const { content, citations } = message;
    
    const parts = Array.isArray(content) ? content : [{ text: content }];
    const textContent = parts.find(p => p.text)?.text || '';
    const imagePart = parts.find(p => p.media);

    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;
    renderer.link = (href, title, text) => {
        const html = linkRenderer.call(renderer, href, title, text);
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
    };

    const rawHtml = marked(textContent, { renderer }) as string;
    const textParts = rawHtml.split(/(\[Sumber \d+\]|\[Ide \d+\]|\[Program \d+\]|\[Event \d+\]|\[Achievement \d+\])/g);

    return (
        <div className="space-y-3">
            {imagePart && (
                <div className="relative h-48 w-full rounded-md overflow-hidden border">
                    <Image src={imagePart.media.url} alt="User upload" layout="fill" objectFit="contain" />
                </div>
            )}
            <ScrollArea className="max-h-60 pr-4">
                 <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                    {textParts.map((part, index) => {
                        const match = part.match(/\[(?:Sumber|Ide|Program|Event|Achievement) (\d+)\]/);
                        if (match) {
                        const num = parseInt(match[1], 10);
                        const citation = citations?.[num - 1];

                        if (citation) {
                            return (
                            <Popover key={index}>
                                <PopoverTrigger asChild>
                                    <sup className="mx-0.5 -top-0.5 relative">
                                    <button className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-semibold hover:bg-primary/20">{num}</button>
                                    </sup>
                                </PopoverTrigger>
                                <PopoverContent className="w-72">
                                    <CitationCard citation={citation} />
                                </PopoverContent>
                                </Popover>
                            );
                        }
                        }
                        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

export default function AssistantPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{file: File, preview: string} | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitialMessage = (): Message => ({
    role: 'assistant',
    content: "Halo! Saya Garda, Agen AI Anda. Apa yang bisa saya bantu hari ini? Anda bisa bertanya tentang cara menggunakan aplikasi, atau meminta bantuan untuk brainstorming ide."
  });

  const createNewThread = useCallback(() => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: Thread = {
      id: newThreadId,
      title: 'Percakapan Baru',
      messages: [getInitialMessage()],
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThreadId);
    setInput('');
    setImage(null);
  }, []);

  useEffect(() => {
    if (threads.length === 0) {
      createNewThread();
    }
  }, [threads, createNewThread]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [threads, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = async (query: string, imageUri?: string) => {
    if (!user || !activeThread) return;
    setIsLoading(true);

    const userMessage: Message = { 
        role: 'user', 
        content: imageUri ? [{ text: query }, { media: { url: imageUri } }] : query 
    };
    
    const updatedThreads = produce(threads, draft => {
        const thread = draft.find(t => t.id === activeThreadId);
        if (thread) {
            if(thread.messages.length === 1) {
                thread.title = query.substring(0, 30) + '...';
            }
            thread.messages.push(userMessage);
        }
    });
    setThreads(updatedThreads);

    try {
      const history = activeThread.messages.slice(1).map(m => ({ role: m.role, content: Array.isArray(m.content) ? m.content.find(p => p.text)?.text || '' : m.content}));
      const assistantResponse = await answerQuestion({ query, userId: user.uid, history, image: imageUri });
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse.responseText,
        citations: assistantResponse.citations,
      };

      const finalThreads = produce(updatedThreads, draft => {
        const thread = draft.find(t => t.id === activeThreadId);
        if(thread) thread.messages.push(assistantMessage);
      });
      setThreads(finalThreads);
    } catch (error) {
      const errorMessage: Message = { role: 'assistant', content: `Maaf, terjadi kesalahan: ${(error as Error).message}` };
      const finalThreads = produce(updatedThreads, draft => {
        const thread = draft.find(t => t.id === activeThreadId);
        if(thread) thread.messages.push(errorMessage);
      });
      setThreads(finalThreads);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !image) || isLoading) return;
    
    let imageAsDataUri: string | undefined;
    if (image) {
        imageAsDataUri = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(image.file);
        });
    }
    
    handleSendMessage(input, imageAsDataUri);
    setInput('');
    setImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        const file = e.target.files[0];
        setImage({ file, preview: URL.createObjectURL(file) });
    }
  };
  
  if (!activeThread) {
     return (
        <MainLayout>
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </MainLayout>
    );
  }

  return (
    <MainLayout>
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6 pb-24">
                {activeThread.messages.map((message, index) => (
                    <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                <Bot size={20} />
                            </div>
                        )}
                        <div className={cn('max-w-[85%] rounded-lg p-3 text-sm', message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-background border')}>
                            <RenderMessage message={message} />
                        </div>
                        {message.role === 'user' && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <UserCircle size={24} />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Bot size={20} />
                        </div>
                        <div className="rounded-lg p-3 text-sm bg-background border">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    </div>
                )}
                {activeThread.messages.length === 1 && (
                    <div className="space-y-2 pt-4">
                        <p className="text-xs text-muted-foreground font-semibold">Atau coba salah satu dari ini:</p>
                        <div className="flex flex-wrap gap-2">
                            {samplePrompts.map(prompt => (
                                <Button key={prompt} size="sm" variant="outline" onClick={() => handleSendMessage(prompt)}>
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
            <div className="fixed bottom-16 left-1/2 w-full max-w-lg -translate-x-1/2 border-t bg-background/95 p-4 backdrop-blur-sm">
                {image && (
                    <div className="relative w-20 h-20 mb-2 rounded-md overflow-hidden border">
                        <Image src={image.preview} alt="upload preview" layout="fill" objectFit="cover" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70"
                            onClick={() => setImage(null)}
                        >
                            <X className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex w-full items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={createNewThread} disabled={isLoading}>
                        <Plus />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                        <Paperclip />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tanyakan sesuatu pada Agen AI..."
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !image)}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    </MainLayout>
  );
}
