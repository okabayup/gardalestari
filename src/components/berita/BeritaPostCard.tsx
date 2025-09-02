import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface BeritaPostCardProps {
  slug: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  imageHint: string;
}

export default function BeritaPostCard({ slug, title, excerpt, imageUrl, imageHint, date }: BeritaPostCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/berita/${slug}`} className="block">
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <CardTitle className="leading-tight">{title}</CardTitle>
          <p className="text-xs text-muted-foreground pt-1">{date}</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">{excerpt}</p>
          <div className="flex items-center text-primary font-semibold text-sm">
            Read More
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
