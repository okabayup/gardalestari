
import Image from 'next/image';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBeritaPosts, getBeritaPost } from '@/app/actions/berita';

// This function tells Next.js which slugs to pre-render at build time
export async function generateStaticParams() {
  const posts = await getBeritaPosts('artikel'); // Only get articles
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBeritaPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <MainLayout>
      <article>
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={post.imageUrl || 'https://picsum.photos/1200/800'}
            alt={post.title}
            data-ai-hint={post.imageHint}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="p-6 -mt-16 relative z-10">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage />
              <AvatarFallback>{post.author ? post.author.charAt(0) : 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author}</p>
              <p className="text-sm text-muted-foreground">{new Date(post.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div
            className="prose prose-green dark:prose-invert mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </MainLayout>
  );
}

    
