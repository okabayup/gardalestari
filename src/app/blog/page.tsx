import MainLayout from '@/components/layout/MainLayout';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { getBlogPosts, BlogPost } from '@/app/actions/blog';

// Revalidate every hour
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Blog Kami</h1>
          <p className="text-muted-foreground">Cerita dan wawasan dari lapangan.</p>
        </div>
        <div className="grid gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">Belum ada postingan yang dipublikasikan.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
