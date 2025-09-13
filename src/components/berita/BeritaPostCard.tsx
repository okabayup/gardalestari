
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '../ui/badge';

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
  const formattedDate = format(new Date(date), "dd MMMM yyyy", { locale: id });
  
  return (
    <Card className="overflow-hidden flex flex-col group">
      <Link href={`/berita/${slug}`} className="block">
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <CardHeader className="p-0">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="secondary">{category}</Badge>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          <Link href={`/berita/${slug}`}>
            <CardTitle className="leading-tight text-lg line-clamp-2 hover:text-primary transition-colors">{title}</CardTitle>
          </Link>
        </CardHeader>
        <CardContent className="p-0 mt-2 flex-grow">
          <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter className="p-0 mt-4">
           <Link href={`/berita/${slug}`} className="flex items-center text-primary font-semibold text-sm hover:underline">
            Baca Selengkapnya
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
}
