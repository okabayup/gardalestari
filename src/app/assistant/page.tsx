
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Link as LinkIcon, Lightbulb, UserCircle, Plus, Trash2, Paperclip, X, MessageSquare, ChevronLeft, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { answerQuestion } from '@/ai/flows/assistant-flow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AssistantOutput, Citation } from '@/lib/definitions';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { produce } from 'immer';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

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
}

interface Thread {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
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
        </div>
    );
};

const ThinkingAnimation = () => (
    <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
    </div>
)

export default function AssistantPage() {
  const { user } = useAuth();
  const router = useRouter();
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
      createdAt: Date.now(),
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThreadId);
    setInput('');
    setImage(null);
  }, []);

  useEffect(() => {
    const savedThreads = localStorage.getItem('ai-threads');
    if (savedThreads) {
      setThreads(JSON.parse(savedThreads));
      const latestThread = JSON.parse(savedThreads)[0];
      if(latestThread) setActiveThreadId(latestThread.id);
    } else {
      createNewThread();
    }
  }, [createNewThread]);
  
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('ai-threads', JSON.stringify(threads));
    }
  }, [threads]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [threads, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = async (query: string, imageUri?: string) => {
    if (!user || !activeThreadId) return;
    setIsLoading(true);

    const userMessage: Message = { 
        role: 'user', 
        content: imageUri ? [{ text: query }, { media: { url: imageUri } }] : query 
    };
    
    setThreads(draft => produce(draft, threads => {
        const thread = threads.find(t => t.id === activeThreadId);
        if (thread) {
            if(thread.messages.length === 1) { // is first user message
                thread.title = query.substring(0, 30) + '...';
            }
            thread.messages.push(userMessage);
        }
    }));

    try {
      const currentThread = threads.find(t => t.id === activeThreadId);
      const history = currentThread?.messages.slice(1).map(m => ({ role: m.role, content: Array.isArray(m.content) ? m.content.find(p => p.text)?.text || '' : m.content})) || [];
      const assistantResponse = await answerQuestion({ query, userId: user.uid, history, image: imageUri });
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse.responseText,
        citations: assistantResponse.citations,
      };

      setThreads(draft => produce(draft, threads => {
        const thread = threads.find(t => t.id === activeThreadId);
        if(thread) thread.messages.push(assistantMessage);
      }));

    } catch (error) {
      const errorMessage: Message = { role: 'assistant', content: `Maaf, terjadi kesalahan: ${(error as Error).message}` };
       setThreads(draft => produce(draft, threads => {
        const thread = threads.find(t => t.id === activeThreadId);
        if(thread) thread.messages.push(errorMessage);
      }));
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

  const handleDeleteThread = (threadId: string) => {
    setThreads(prev => {
        const newThreads = prev.filter(t => t.id !== threadId);
        if (newThreads.length === 0) {
            createNewThread();
        } else if (activeThreadId === threadId) {
            setActiveThreadId(newThreads[0].id);
        }
        return newThreads;
    });
  }

  const HistorySidebar = () => (
    <div className="flex flex-col h-full bg-muted/50">
        <div className="p-4 flex items-center justify-between border-b">
            <Button variant="outline" size="sm" onClick={() => router.push('/feed')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
            </Button>
            <Button variant="ghost" size="icon" onClick={createNewThread}><Plus /></Button>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
            {threads.sort((a,b) => b.createdAt - a.createdAt).map(thread => (
                 <div key={thread.id} className="relative group">
                    <button
                        onClick={() => setActiveThreadId(thread.id)}
                        className={cn(
                            'w-full text-left p-2 rounded-md text-sm truncate',
                            activeThreadId === thread.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'
                        )}
                    >
                        {thread.title}
                    </button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteThread(thread.id)}
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            ))}
            </div>
        </ScrollArea>
    </div>
  );

  return (
    <MainLayout>
        <div className="h-full grid md:grid-cols-[280px_1fr]">
            <aside className="hidden md:block border-r h-full">
                <HistorySidebar />
            </aside>
            <div className="relative flex flex-col h-full">
                <header className="md:hidden p-2 border-b flex items-center justify-between gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/feed')}><ChevronLeft /></Button>
                    <h2 className="font-semibold truncate text-center">{activeThread?.title}</h2>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon"><Menu /></Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-3/4">
                             <HistorySidebar />
                        </SheetContent>
                    </Sheet>
                </header>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="max-w-4xl mx-auto space-y-8 pb-32">
                    {activeThread?.messages.map((message, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className={cn(
                                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                                message.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                            )}>
                                {message.role === 'user' ? <UserCircle size={24} /> : <Bot size={20} />}
                            </div>
                            <div className="flex-1 pt-1">
                                <RenderMessage message={message} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div className="pt-2.5">
                                <ThinkingAnimation />
                            </div>
                        </div>
                    )}
                    {activeThread?.messages.length === 1 && (
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
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
                    <div className="max-w-4xl mx-auto">
                         <div className="relative rounded-lg border bg-background shadow-lg">
                            {image && (
                                <div className="p-2 border-b">
                                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
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
                                </div>
                            )}
                             <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex w-full items-center p-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                    <Paperclip />
                                </Button>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Tanyakan sesuatu pada Agen AI..."
                                    disabled={isLoading}
                                    className="flex-1 border-none shadow-none focus-visible:ring-0"
                                />
                                <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !image)}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
  );
}
