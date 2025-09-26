
'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Link as LinkIcon, Lightbulb, UserCircle, Plus, Trash2, Paperclip, X, ChevronLeft, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { answerQuestion } from '@/ai/flows/assistant-flow';
import { useRouter } from 'next/navigation';
import type { AssistantOutput, Citation } from '@/lib/definitions';
import { produce } from 'immer';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Dynamically import components
const RenderMessage = React.lazy(() => import('@/components/assistant/RenderMessage'));
const HistoryList = React.lazy(() => import('@/components/assistant/HistoryList'));
const SamplePrompts = React.lazy(() => import('@/components/assistant/SamplePrompts'));

interface Message {
  role: 'user' | 'assistant';
  content: any;
  citations?: Citation[];
}

export interface Thread {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
}

const ThinkingAnimation = () => (
    <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
    </div>
);

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
    try {
        const savedThreads = localStorage.getItem('ai-threads');
        if (savedThreads) {
          const parsedThreads = JSON.parse(savedThreads);
          setThreads(parsedThreads);
          const latestThread = parsedThreads[0];
          if(latestThread) setActiveThreadId(latestThread.id);
          else createNewThread();
        } else {
          createNewThread();
        }
    } catch (e) {
        console.error("Failed to parse threads from localStorage", e);
        createNewThread();
    }
  }, [createNewThread]);
  
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('ai-threads', JSON.stringify(threads));
    } else {
      localStorage.removeItem('ai-threads');
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
        if (activeThreadId === threadId) {
            if (newThreads.length > 0) {
              setActiveThreadId(newThreads[0].id);
            } else {
              // This will trigger createNewThread via useEffect
              setActiveThreadId(null); 
            }
        }
        return newThreads;
    });
  };

  return (
    <MainLayout>
        <div className="h-full grid md:grid-cols-[280px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col border-r h-full bg-muted/50">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-lg">Riwayat Percakapan</h2>
                </div>
                <div className="p-4 flex items-center justify-between border-b">
                    <Button variant="outline" size="sm" onClick={() => router.push('/feed')}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
                    </Button>
                    <Button variant="ghost" size="icon" onClick={createNewThread}><Plus /></Button>
                </div>
                <Suspense fallback={<div className="p-4"><Loader2 className="animate-spin" /></div>}>
                    <HistoryList
                        threads={threads}
                        activeThreadId={activeThreadId}
                        setActiveThreadId={setActiveThreadId}
                        handleDeleteThread={handleDeleteThread}
                    />
                </Suspense>
            </aside>
            <div className="relative flex flex-col h-full">
                {/* Mobile Header */}
                <header className="md:hidden p-2 border-b flex items-center justify-between gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/feed')}><ChevronLeft /></Button>
                    <h2 className="font-semibold truncate text-center">{activeThread?.title}</h2>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon"><Menu /></Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-3/4 flex flex-col">
                             <SheetHeader className="p-4 border-b">
                                <SheetTitle className="text-left">Riwayat Percakapan</SheetTitle>
                             </SheetHeader>
                             <div className="p-4 flex items-center justify-between border-b">
                                <Button variant="outline" size="sm" onClick={createNewThread}><Plus className="mr-2 h-4 w-4"/> Baru</Button>
                            </div>
                            <Suspense fallback={<div className="p-4"><Loader2 className="animate-spin" /></div>}>
                                <HistoryList
                                    threads={threads}
                                    activeThreadId={activeThreadId}
                                    setActiveThreadId={setActiveThreadId}
                                    handleDeleteThread={handleDeleteThread}
                                />
                            </Suspense>
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
                                <Suspense fallback={<p>Memuat...</p>}>
                                    <RenderMessage message={message} />
                                </Suspense>
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
                         <Suspense fallback={null}>
                            <SamplePrompts onSelectPrompt={handleSendMessage} />
                        </Suspense>
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
