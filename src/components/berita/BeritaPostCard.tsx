'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface BeritaPostCardProps {
  slug: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  imageHint: string;
  category: string;
}

export default function BeritaPostCard({ slug, title, excerpt, imageUrl, imageHint, date, category }: BeritaPostCardProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
      const formatDate = async () => {
          const { id } = await import('date-fns/locale/id');
          setFormattedDate(format(new Date(date), "dd MMMM yyyy", { locale: id }));
      };
      formatDate();
  }, [date]);
  
  return (
    <Card className="organic-card overflow-hidden flex flex-col group border-none shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-500 bg-white">
      <Link href={`/berita/${slug}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 backdrop-blur-md text-accent border-none font-bold shadow-sm">{category}</Badge>
          </div>
        </div>
      </Link>
      <div className="p-6 flex flex-col flex-grow space-y-4">
        <CardHeader className="p-0 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Calendar size={12} className="text-primary" />
            {formattedDate || 'Memuat...'}
          </div>
          <Link href={`/berita/${slug}`}>
            <CardTitle className="leading-tight text-xl font-black text-accent line-clamp-2 hover:text-primary transition-colors tracking-tight">{title}</CardTitle>
          </Link>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 font-medium">{excerpt}</p>
        </CardContent>
        <CardFooter className="p-0 pt-2">
           <Button asChild variant="link" className="p-0 h-auto font-black text-xs uppercase tracking-widest text-primary hover:no-underline group">
            <Link href={`/berita/${slug}`} className="flex items-center">
                Baca Selengkapnya
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
