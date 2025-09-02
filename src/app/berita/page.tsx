
'use client';
import MainLayout from '@/components/layout/MainLayout';
import BeritaPostCard from '@/components/berita/BeritaPostCard';
import { getBeritaPosts, BeritaPost } from '@/app/actions/berita';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';

export default function BeritaPage() {
  const [posts, setPosts] = useState<BeritaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getBeritaPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Gagal memuat berita',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [toast]);


  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-center sm:text-left">
            <h1 className="font-headline text-3xl font-bold">Berita Kami</h1>
            <p className="text-muted-foreground">Cerita dan wawasan dari lapangan.</p>
          </div>
          <Button onClick={() => router.push('/panel/berita/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Berita
          </Button>
        </div>
        {loading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid gap-6">
            {posts.length > 0 ? (
                posts.map((post) => (
                <BeritaPostCard key={post.slug} {...post} />
                ))
            ) : (
                <p className="text-center text-muted-foreground py-10">Belum ada berita yang dipublikasikan.</p>
            )}
            </div>
        )}
      </div>
    </MainLayout>
  );
}
