import MainLayout from '@/components/layout/MainLayout';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { blogPosts } from '@/lib/placeholder-data';

export default function BlogPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Our Blog</h1>
          <p className="text-muted-foreground">Stories and insights from the field</p>
        </div>
        <div className="grid gap-6">
          {blogPosts.map((post) => (
            <BlogPostCard key={post.slug} {...post} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
