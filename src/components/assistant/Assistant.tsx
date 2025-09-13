'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Bot, User, Send, Loader2, Link as LinkIcon, Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { answerQuestion } from '@/ai/flows/assistant-flow';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { format } from 'date-fns';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { AssistantOutput, Citation } from '@/lib/definitions';


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

// Function to parse the response text and render citations as links
const RenderWithCitations = ({ text, citations }: { text: string; citations: Citation[] | undefined }) => {
  if (!citations || citations.length === 0) {
    return <p>{text}</p>;
  }

  const parts = text.split(/(\[Sumber \d+\]|\[Ide \d+\])/g);

  return (
    <p>
      {parts.map((part, index) => {
        const match = part.match(/\[(?:Sumber|Ide) (\d+)\]/);
        if (match) {
          const num = parseInt(match[1], 10);
          const citation = citations[num - 1];

          if (citation) {
            return (
              <Popover key={index}>
                  <PopoverTrigger asChild>
                    <sup className="mx-0.5">
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
        return part;
      })}
    </p>
  );
};


const AssistantUI = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Halo! Saya Garda, asisten AI Anda. Apa yang bisa saya bantu hari ini? Anda bisa bertanya tentang cara menggunakan aplikasi, atau meminta bantuan untuk brainstorming ide." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantResponse: AssistantOutput = await answerQuestion({ query: input, userId: user.uid });
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
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-background'}`}>
                <RenderWithCitations text={message.content} citations={message.citations} />
              </div>
               {message.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User size={20} />
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
        </div>
      </ScrollArea>
      <SheetFooter className="pt-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
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
      </SheetFooter>
    </div>
  );
};

export default function Assistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-36 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-6 w-6" />
        <span className="sr-only">Buka Asisten AI</span>
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-lg">
          <SheetHeader>
            <SheetTitle>Asisten AI Garda</SheetTitle>
            <SheetDescription>
              Tanyakan apa saja tentang Garda Lestari atau minta bantuan untuk brainstorming ide.
            </SheetDescription>
          </SheetHeader>
          <AssistantUI />
        </SheetContent>
      </Sheet>
    </>
  );
}
