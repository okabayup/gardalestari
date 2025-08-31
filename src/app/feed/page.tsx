
'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { getPosts, togglePostLike, PostWithAuthor } from '@/app/actions/posts';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';


export default function FeedPage() {
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const fetchedPosts = await getPosts(user.uid);
        setAllPosts(fetchedPosts);
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
  
  const filteredPosts = useMemo(() => {
    if (!searchTerm) {
      return allPosts;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return allPosts.filter(post => 
      post.caption.toLowerCase().includes(lowercasedFilter) ||
      post.author.name.toLowerCase().includes(lowercasedFilter) ||
      post.author.username.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, allPosts]);


  const handleToggleLike = async (postId: string) => {
    if (!user) return;

    // Optimistic UI update
    setAllPosts(prevPosts =>
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
      const freshPosts = await getPosts(user.uid);
      setAllPosts(freshPosts);
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari postingan atau pengguna..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {filteredPosts.length > 0 ? (
           filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={() => handleToggleLike(post.id)}
            />
          ))
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold">{searchTerm ? 'Tidak ada hasil' : 'Selamat Datang!'}</h3>
            <p className="text-muted-foreground">{searchTerm ? 'Coba kata kunci lain.' : 'Belum ada postingan. Jadilah yang pertama!'}</p>
          </div>
        )}
      </div>
      <Button asChild className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
        <Link href="/feed/new">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Buat Postingan Baru</span>
        </Link>
      </Button>
    </MainLayout>
  );
}
