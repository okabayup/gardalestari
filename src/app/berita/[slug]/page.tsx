
import Image from 'next/image';
import { notFound } from 'next/navigation';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBeritaPost } from '@/app/actions/berita';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { Metadata, ResolvingMetadata } from 'next';
import { logAnalyticsEvent } from '@/lib/analytics';
import BeritaShareButton from '@/components/berita/BeritaShareButton';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const post = await getBeritaPost(slug);

  if (!post) {
    return {
      title: 'Berita Tidak Ditemukan',
    }
  }
  
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/berita/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/berita/${slug}`,
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.imageUrl],
    },
  }
}


export default async function BeritaPostPage({ params }: Props) {
  const slug = params.slug;
  const post = await getBeritaPost(slug);

  if (!post) {
    return notFound();
  }

  const formattedDate = format(new Date(post.date), "dd MMMM yyyy", { locale: id });
  const isoDate = new Date(post.date).toISOString();
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_BASE_URL}/berita/${slug}`,
    },
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl,
    author: {
      '@type': 'Organization',
      name: 'Garda Lestari',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Garda Lestari',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
      },
    },
    datePublished: isoDate,
    dateModified: isoDate,
  };


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              priority
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
              <BeritaShareButton post={post} />
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
