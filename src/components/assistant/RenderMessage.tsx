
'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Link as LinkIcon, Lightbulb } from 'lucide-react';
import { marked } from 'marked';
import type { Citation } from '@/lib/definitions';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: any; // Can be string or array of parts for multimodal
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
};

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

export default RenderMessage;
