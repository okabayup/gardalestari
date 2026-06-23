
import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { getPostById, togglePostLike, archivePost } from '@/app/actions/posts';
import { unstable_noStore as noStore } from 'next/cache';

// This is a dynamic page, so we don't need generateStaticParams
// It will be rendered on-demand.

interface PostDetailPageProps {
  params: { id: string };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  noStore(); // Ensures the page is always dynamic
  const { id: postId } = params;
  
  // Get current user on the server
  const currentUserId = undefined; // Auth handled client-side

  if (!postId) {
    notFound();
  }

  const post = await getPostById(postId, currentUserId);

  if (!post) {
    notFound();
  }

  // Server actions can be passed down to client components
  // We don't need the client-side handlers here anymore.

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <PostCard
          post={post}
          // The handlers on the PostCard component will now call the server actions directly
          onToggleLike={async () => {
            'use server';
            if (!currentUserId) return;
            await togglePostLike(postId, currentUserId);
          }}
          onArchive={async () => {
            'use server';
            await archivePost(postId);
            // Optionally redirect or handle UI change after archiving
          }}
          onUnarchive={async () => {
            'use server';
             // This function might not be used here, but for consistency.
          }}
          currentUserId={currentUserId}
          isDetailPage={true}
        />
      </div>
    </MainLayout>
  );
}
