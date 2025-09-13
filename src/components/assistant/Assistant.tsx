
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Link as LinkIcon, Lightbulb, UserCircle, Mic, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { answerQuestion } from '@/ai/flows/assistant-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { AssistantOutput, Citation } from '@/lib/definitions';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { produce } from 'immer';

const samplePrompts = [
    'Bagaimana cara mengajukan ide baru?',
    'Bantu saya membuat ide bisnis di sektor pertanian.',
    'Program apa saja yang sedang dibuka?',
    'Bagaimana cara melihat Kartu Tanda Anggota saya?',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
    const { content, citations, audioUrl } = message;
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if(audioUrl && audioRef.current) {
            audioRef.current.play().catch(e => console.error("Autoplay failed", e));
        }
    }, [audioUrl]);

    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;
    renderer.link = (href, title, text) => {
        const html = linkRenderer.call(renderer, href, title, text);
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
    };

    const rawHtml = marked(content, { renderer }) as string;
    const parts = rawHtml.split(/(\[Sumber \d+\]|\[Ide \d+\]|\[Program \d+\]|\[Event \d+\]|\[Achievement \d+\])/g);

    return (
        <div className="space-y-3">
            <ScrollArea className="max-h-60 pr-4">
                 <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                    {parts.map((part, index) => {
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
            {audioUrl && (
                <audio ref={audioRef} controls src={audioUrl} className="w-full h-10" />
            )}
        </div>
    );
};


const AssistantUI = ({ thread, onSendMessage, isLoading, onNewThread }: { 
    thread: Thread;
    onSendMessage: (message: string, isVoice: boolean) => Promise<void>; 
    isLoading: boolean;
    onNewThread: () => void;
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [thread.messages]);

  const handleSubmit = (isVoice = false) => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input, isVoice);
    setInput('');
  };
  
  const handleVoiceInput = () => {
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung pengenalan suara.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onSendMessage(transcript, true);
    };

    recognition.start();
  };


  return (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef}>
            <div className="space-y-6 pb-4">
            {thread.messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Bot size={20} />
                    </div>
                )}
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-background'}`}>
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
                    <div className="rounded-lg p-3 text-sm bg-background">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                </div>
            )}
            {thread.messages.length === 1 && (
                <div className="space-y-2 pt-4">
                    <p className="text-xs text-muted-foreground font-semibold">Atau coba salah satu dari ini:</p>
                    <div className="flex flex-wrap gap-2">
                        {samplePrompts.map(prompt => (
                            <Button key={prompt} size="sm" variant="outline" onClick={() => onSendMessage(prompt, false)}>
                                {prompt}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>
        <div className="pt-4 border-t">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex w-full items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={onNewThread} disabled={isLoading}>
                <Plus />
            </Button>
            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu pada Garda..."
                disabled={isLoading}
            />
            <Button type="button" variant="ghost" size="icon" onClick={handleVoiceInput} disabled={isLoading}>
                <Mic className={cn(isListening && "text-destructive")}/>
            </Button>
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            </form>
        </div>
    </div>
  );
};

export default function Assistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInitialMessage = (): Message => ({
    role: 'assistant',
    content: "Halo! Saya Garda, asisten AI Anda. Apa yang bisa saya bantu hari ini? Anda bisa bertanya tentang cara menggunakan aplikasi, atau meminta bantuan untuk brainstorming ide."
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
  }, []);

  useEffect(() => {
    if (isOpen && threads.length === 0) {
      createNewThread();
    }
  }, [isOpen, threads, createNewThread]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = async (query: string, isVoiceInput: boolean) => {
    if (!user || !activeThread) return;
    setIsLoading(true);

    const userMessage: Message = { role: 'user', content: query, isVoiceInput };
    
    // Update state optimistically
    const updatedThreads = produce(threads, draft => {
        const thread = draft.find(t => t.id === activeThreadId);
        if (thread) {
            if(thread.messages.length === 1) { // First user message
                thread.title = query.substring(0, 30) + '...';
            }
            thread.messages.push(userMessage);
        }
    });
    setThreads(updatedThreads);

    try {
      const history = activeThread.messages.slice(1);
      const assistantResponse = await answerQuestion({ query, userId: user.uid, history });
      
      let audioUrl: string | undefined;
      if (isVoiceInput) {
          const ttsResponse = await textToSpeech(assistantResponse.responseText);
          audioUrl = ttsResponse.audioDataUri;
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse.responseText,
        citations: assistantResponse.citations,
        audioUrl: audioUrl,
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

  const handleDeleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (activeThreadId === threadId) {
        if(threads.length > 1) {
            setActiveThreadId(threads.find(t => t.id !== threadId)!.id);
        } else {
            createNewThread();
        }
    }
  }


  return (
    <>
      <Button
        className="fixed bottom-36 right-4 h-12 w-12 rounded-full shadow-lg bg-background/70 backdrop-blur-lg"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-6 w-6 text-primary" />
        <span className="sr-only">Buka Asisten AI</span>
      </Button>
       <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-[85vh] w-[95vw] max-w-4xl flex flex-col p-0 gap-0">
           <DialogHeader className="sr-only">
                <DialogTitle>Asisten AI Garda</DialogTitle>
                <p>Asisten AI untuk Garda Lestari</p>
           </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] h-full">
            <div className="hidden md:flex flex-col bg-muted/50 border-r h-full">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Riwayat Percakapan</h2>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {threads.map(thread => (
                            <div key={thread.id} className="relative group">
                                <Button 
                                    variant={activeThreadId === thread.id ? 'secondary' : 'ghost'} 
                                    className="w-full justify-start text-left h-auto"
                                    onClick={() => setActiveThreadId(thread.id)}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0"/>
                                    <span className="truncate flex-1">{thread.title}</span>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                                    onClick={() => handleDeleteThread(thread.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t">
                    <Button variant="outline" className="w-full" onClick={createNewThread}>
                        <Plus className="mr-2 h-4 w-4"/> Percakapan Baru
                    </Button>
                </div>
            </div>
            <div className="p-6 flex flex-col h-full overflow-hidden">
                {activeThread ? (
                    <AssistantUI 
                        thread={activeThread} 
                        onSendMessage={handleSendMessage} 
                        isLoading={isLoading}
                        onNewThread={createNewThread}
                    />
                ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Bot className="h-10 w-10 mb-4"/>
                        <p>Mulai percakapan baru atau pilih dari riwayat.</p>
                     </div>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
