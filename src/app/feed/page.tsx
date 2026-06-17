
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { getPosts, togglePostLike, PostWithAuthor, archivePost } from '@/app/actions/posts';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisibleId, setLastVisibleId] = useState<string | null | undefined>(undefined);
  const { user } = useAuth();
  const { toast } = useToast();
  const loaderRef = useRef<HTMLDivElement>(null);
  
  const fetchPosts = useCallback(async (isInitial = false) => {
      if (!user) return;
      
      if(isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const lastId = isInitial ? undefined : lastVisibleId;
        const { posts: newPosts, lastVisibleId: newLastVisibleId } = await getPosts(user.uid, lastId);
        
        setPosts(prevPosts => isInitial ? newPosts : [...prevPosts, ...newPosts]);

        setLastVisibleId(newLastVisibleId);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Gagal memuat feed',
          description: 'Terjadi kesalahan saat mengambil data postingan.'
        });
        console.error(error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }, [user, toast, lastVisibleId]);

  // Initial fetch
  useEffect(() => {
    if (user && posts.length === 0) {
      fetchPosts(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && lastVisibleId) {
          fetchPosts();
        }
      },
      { threshold: 1.0 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [fetchPosts, lastVisibleId, loadingMore, loading]);


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
        });
        // Revert on error - not perfect, a re-fetch might be better
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              const wasLiked = !post.isLiked; // Revert the change
              return {
                ...post,
                isLiked: wasLiked,
                likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
              };
            }
            return post;
          })
        );
    }
  };

  const handleArchivePost = async (postId: string) => {
    // Optimistic UI update
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));

    try {
        await archivePost(postId);
        toast({ title: 'Postingan diarsipkan.' });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Gagal Mengarsipkan',
            description: (error as Error).message,
        });
        // On failure, we should re-fetch to get consistent state
        if (user) {
          setPosts([]);
          setLastVisibleId(undefined);
          fetchPosts(true);
        }
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
        {posts.length > 0 ? (
           posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={() => handleToggleLike(post.id)}
              onArchive={() => handleArchivePost(post.id)}
              onUnarchive={()=>{}}
              currentUserId={user?.uid}
            />
          ))
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold">Selamat Datang!</h3>
            <p className="text-muted-foreground">Belum ada postingan. Jadilah yang pertama!</p>
          </div>
        )}
        <div ref={loaderRef} className="flex justify-center py-4">
            {loadingMore && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {!loadingMore && !lastVisibleId && posts.length > 0 && <p className="text-sm text-muted-foreground">Anda telah mencapai akhir.</p>}
        </div>
      </div>
      <Button asChild className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-background/70 backdrop-blur-lg" size="icon">
        <Link href="/feed/new">
            <Plus className="h-6 w-6 text-primary" />
            <span className="sr-only">Buat Postingan Baru</span>
        </Link>
      </Button>
    </MainLayout>
  );
}
