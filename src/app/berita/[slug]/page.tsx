
import Image from 'next/image';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBeritaPosts, getBeritaPost } from '@/app/actions/berita';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

// This function tells Next.js which slugs to pre-render at build time
export async function generateStaticParams() {
  const posts = await getBeritaPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BeritaPostPage({ params }: { params: { slug: string } }) {
  const post = await getBeritaPost(params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate = format(new Date(post.date), "dd MMMM yyyy", { locale: id });


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
        <div className="p-6 -mt-24 relative z-10 space-y-4">
          <Badge variant="secondary">{post.category}</Badge>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">{post.title}</h1>
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
          <div
            className="prose dark:prose-invert mt-8 max-w-none prose-h1:font-headline prose-h2:font-headline prose-p:text-base prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </MainLayout>
  );
}
