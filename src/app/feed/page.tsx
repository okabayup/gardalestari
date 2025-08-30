import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { placeholderPosts } from '@/lib/placeholder-data';

export default function FeedPage() {
  return (
    <MainLayout>
      <div className="p-4 space-y-4 md:p-6 md:space-y-6">
        {placeholderPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </MainLayout>
  );
}
