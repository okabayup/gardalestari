
'use client';

import { notFound } from 'next/navigation';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getBeritaPost } from '@/app/actions/berita';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { Metadata, ResolvingMetadata } from 'next';
import BeritaShareButton from '@/components/berita/BeritaShareButton';

type Props = {
  params: { slug: string }
}

// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const slug = params.slug;
//   const post = await getBeritaPost(slug);

//   if (!post || post.type !== 'video' || !post.youtubeId) {
//     return {
//       title: 'Video Tidak Ditemukan',
//     }
//   }
  
//   const thumbnailUrl = `https://img.youtube.com/vi/${post.youtubeId}/maxresdefault.jpg`;
//   const previousImages = (await parent).openGraph?.images || []

//   return {
//     title: post.title,
//     description: post.excerpt,
//     alternates: {
//       canonical: `/video/${slug}`,
//     },
//     openGraph: {
//       title: post.title,
//       description: post.excerpt,
//       url: `/video/${slug}`,
//       type: 'video.other',
//       images: [
//         {
//           url: thumbnailUrl,
//           width: 1280,
//           height: 720,
//           alt: post.title,
//         },
//         ...previousImages,
//       ],
//     },
//     twitter: {
//       card: 'summary_large_image',
//       title: post.title,
//       description: post.excerpt,
//       images: [thumbnailUrl],
//     },
//   }
// }

export default async function VideoPostPage({ params }: Props) {
  const slug = params.slug;
  const post = await getBeritaPost(slug);

  if (!post || post.type !== 'video' || !post.youtubeId) {
    return notFound();
  }

  const formattedDate = format(new Date(post.date), "dd MMMM yyyy", { locale: id });
  const isoDate = new Date(post.date).toISOString();
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: post.title,
    description: post.excerpt,
    thumbnailUrl: `https://img.youtube.com/vi/${post.youtubeId}/maxresdefault.jpg`,
    uploadDate: isoDate,
    embedUrl: `https://www.youtube.com/embed/${post.youtubeId}`,
    publisher: {
      '@type': 'Organization',
      name: 'Garda Lestari',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
      },
    },
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
            <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src={`https://www.youtube.com/embed/${post.youtubeId}`}
                    title={post.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>
          <div className="p-6 space-y-4">
            <Badge variant="secondary">{post.category}</Badge>
            <h1 className="font-headline text-3xl md:text-4xl font-bold">{post.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
              <BeritaShareButton post={post} />
            </div>
            <div
              className="prose dark:prose-invert mt-8 max-w-none prose-sm"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
