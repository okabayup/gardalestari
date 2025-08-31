
'use client'

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { getPostById, togglePostLike, archivePost, PostWithAuthor } from '@/app/actions/posts';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: postId } = params;
  
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPost = async () => {
    if (!postId || typeof postId !== 'string') return;
    setLoading(true);
    try {
      const fetchedPost = await getPostById(postId, user?.uid);
      if (!fetchedPost) {
        notFound();
      } else {
        setPost(fetchedPost);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat postingan.' });
      notFound();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.uid]);


  const handleToggleLike = async () => {
    if (!user || !post) return;
    // Optimistic UI update
    setPost(prevPost => {
        if (!prevPost) return null;
        const wasLiked = prevPost.isLiked;
        return {
            ...prevPost,
            isLiked: !wasLiked,
            likesCount: wasLiked ? prevPost.likesCount - 1 : prevPost.likesCount + 1,
        };
    });
    try {
      await togglePostLike(post.id, user.uid);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan perubahan.' });
       fetchPost(); // Re-fetch to revert
    }
  };

  const handleArchivePost = async () => {
    if (!post) return;
    try {
        await archivePost(post.id);
        toast({ title: 'Postingan diarsipkan.' });
        router.push('/feed'); // Redirect after archiving
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal Mengarsipkan', description: (error as Error).message });
    }
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
      return null;
  }

  return (
    <MainLayout>
       <div className="p-4 md:p-6">
         <PostCard
            post={post}
            onToggleLike={handleToggleLike}
            onArchive={handleArchivePost}
            currentUserId={user?.uid}
        />
      </div>
    </MainLayout>
  );
}
