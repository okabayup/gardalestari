import Image from 'next/image';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { blogPosts } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <MainLayout>
      <article>
        <div className="relative h-64 w-full">
          <Image
            src={post.imageUrl}
            alt={post.title}
            data-ai-hint={post.imageHint}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="p-4 -mt-16 relative z-10">
          <h1 className="font-headline text-3xl font-bold">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage />
              <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author}</p>
              <p className="text-sm text-muted-foreground">{post.date}</p>
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
