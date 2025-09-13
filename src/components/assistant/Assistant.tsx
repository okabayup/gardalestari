
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Bot, User, Send, Loader2, Link as LinkIcon, Lightbulb, UserCircle, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { answerQuestion } from '@/ai/flows/assistant-flow';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { AssistantOutput, Citation } from '@/lib/definitions';
import { marked } from 'marked';

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

    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;
    renderer.link = (href, title, text) => {
        const html = linkRenderer.call(renderer, href, title, text);
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
    };

    const rawHtml = marked(content, { renderer }) as string;
    const parts = rawHtml.split(/(\[Sumber \d+\]|\[Ide \d+\]|\[Program \d+\]|\[Event \d+\]|\[Achievement \d+\])/g);

    return (
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
                 // Use dangerouslySetInnerHTML for Markdown-rendered parts
                return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
            })}
        </div>
    );
};


const AssistantUI = ({ onSendMessage }: { onSendMessage: (message: string) => Promise<AssistantOutput> }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Halo! Saya Garda, asisten AI Anda. Apa yang bisa saya bantu hari ini? Anda bisa bertanya tentang cara menggunakan aplikasi, atau meminta bantuan untuk brainstorming ide." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (prompt?: string) => {
    const userQuery = prompt || input;
    if (!userQuery.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: userQuery };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(0, -1); // Exclude the initial welcome message
      const assistantResponse = await onSendMessage(userQuery);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse.responseText,
        citations: assistantResponse.citations,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Maaf, terjadi kesalahan: ${(error as Error).message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef}>
            <div className="space-y-6">
            {messages.map((message, index) => (
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
            {messages.length === 1 && (
                <div className="space-y-2 pt-4">
                    <p className="text-xs text-muted-foreground font-semibold">Atau coba salah satu dari ini:</p>
                    <div className="flex flex-wrap gap-2">
                        {samplePrompts.map(prompt => (
                            <Button key={prompt} size="sm" variant="outline" onClick={() => handleSubmit(prompt)}>
                                {prompt}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex w-full items-center gap-2">
            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu pada Garda..."
                disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            </form>
        </DialogFooter>
    </div>
  );
};

export default function Assistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const handleSendMessage = async (query: string): Promise<AssistantOutput> => {
    if (!user) throw new Error("User not authenticated");
    
    const response = await answerQuestion({ 
        query, 
        userId: user.uid,
        history: conversationHistory 
    });

    setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: response.responseText, citations: response.citations }
    ]);
    return response;
  }

  return (
    <>
      <Button
        className="fixed bottom-36 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <BrainCircuit className="h-6 w-6" />
        <span className="sr-only">Buka Asisten AI</span>
      </Button>
       <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-[85vh] w-[95vw] max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle>Asisten AI Garda</DialogTitle>
            <DialogDescription>
              Tanyakan apa saja tentang Garda Lestari atau minta bantuan untuk brainstorming ide.
            </DialogDescription>
          </DialogHeader>
          <AssistantUI onSendMessage={handleSendMessage} />
        </DialogContent>
      </Dialog>
    </>
  );
}
