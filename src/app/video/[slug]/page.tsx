
import { notFound } from 'next/navigation';
import { getBeritaPost } from '@/app/actions/berita';
import type { Metadata, ResolvingMetadata } from 'next';
import VideoPostClient from './VideoPostClient';


type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const post = await getBeritaPost(slug);

  if (!post || post.type !== 'video' || !post.youtubeId || post.status !== 'published') {
    return {
      title: 'Video Tidak Ditemukan',
    }
  }
  
  const thumbnailUrl = `https://img.youtube.com/vi/${post.youtubeId}/maxresdefault.jpg`;
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/video/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/video/${slug}`,
      type: 'video.other',
      images: [
        {
          url: thumbnailUrl,
          width: 1280,
          height: 720,
          alt: post.title,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [thumbnailUrl],
    },
  }
}

export default async function VideoPostPage({ params }: Props) {
    const post = await getBeritaPost(params.slug);

    if (!post || post.type !== 'video' || post.status !== 'published') {
        notFound();
    }

    return <VideoPostClient post={post} />;
}
