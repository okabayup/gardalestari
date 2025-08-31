
'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { getPosts, togglePostLike, PostWithAuthor } from '@/app/actions/posts';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const fetchedPosts = await getPosts(user.uid);
        setPosts(fetchedPosts);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Gagal memuat feed',
          description: 'Terjadi kesalahan saat mengambil data postingan.'
        })
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user, toast]);
  

  const handleToggleLike = async (postId: string) => {
    if (!user) return;

    // Optimistic UI update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const wasLiked = post.isLiked;
          return {
            ...post,
            isLiked: !wasLiked,
            likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      })
    );

    try {
      await togglePostLike(postId, user.uid);
    } catch (error) {
       toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Gagal menyimpan perubahan.'
        })
      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const wasLiked = !post.isLiked; // Revert the change
             return {
              ...post,
              isLiked: wasLiked,
              likesCount: wasLiked ? (post.likesCount || 0) - 1 : (post.likesCount || 0) + 1,
            };
          }
          return post;
        })
      );
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

  return (
    <MainLayout>
      <div className="p-4 space-y-4 md:p-6 md:space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={() => handleToggleLike(post.id)}
          />
        ))}
      </div>
    </MainLayout>
  );
}

