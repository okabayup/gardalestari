
'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBeritaPost } from '@/app/actions/berita';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import type { BeritaPost } from '@/app/actions/berita';
import { Loader2, Share2 } from 'lucide-react';
import { logAnalyticsEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BeritaPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BeritaPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      getBeritaPost(slug).then(fetchedPost => {
        if (fetchedPost) {
          setPost(fetchedPost);
          logAnalyticsEvent('view_item', {
              item_id: fetchedPost.id,
              item_name: fetchedPost.title,
              item_category: 'berita',
          });
        } else {
          notFound();
        }
        setLoading(false);
      });
    }
  }, [slug]);

  const handleShare = async () => {
    if (!post) return;
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        logAnalyticsEvent('share', { content_type: 'berita', item_id: post.id });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Tautan disalin!',
        description: 'Tautan berita telah disalin ke clipboard Anda.',
      });
    }
  };

  if (loading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  if (!post) {
    return notFound();
  }

  const formattedDate = format(new Date(post.date), "dd MMMM yyyy", { locale: id });


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <article className="container max-w-4xl mx-auto py-12 md:py-16">
          <div className="relative h-64 md:h-80 w-full rounded-lg overflow-hidden">
            <Image
              src={post.imageUrl || 'https://picsum.photos/1200/800'}
              alt={post.title}
              data-ai-hint={post.imageHint}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="p-6 -mt-24 relative z-10 space-y-4">
            <Badge variant="secondary">{post.category}</Badge>
            <h1 className="font-headline text-3xl md:text-4xl font-bold">{post.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage />
                  <AvatarFallback>{post.author ? post.author.charAt(0) : 'A'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.author}</p>
                  <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Bagikan</span>
              </Button>
            </div>
            <div
              className="prose dark:prose-invert mt-8 max-w-none prose-h1:font-headline prose-h2:font-headline prose-p:text-base prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
