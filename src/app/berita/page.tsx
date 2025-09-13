
'use client';

import { getBeritaPosts, BeritaPost } from '@/app/actions/berita';
import BeritaPostCard from '@/components/berita/BeritaPostCard';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { useEffect, useState } from 'react';

export default function BeritaPage() {
  const [posts, setPosts] = useState<BeritaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBeritaPosts('artikel').then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
        <LandingHeader />
        <main className="flex-1">
            <div className="container py-12 md:py-16">
                <div className="text-center sm:text-left mb-8">
                    <h1 className="font-headline text-3xl font-bold">Berita Kami</h1>
                    <p className="text-muted-foreground">Cerita dan wawasan dari lapangan.</p>
                </div>
                {loading ? (
                  <p>Memuat...</p>
                ) : posts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <BeritaPostCard key={post.slug} {...post} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">Belum ada berita yang dipublikasikan.</p>
                )}
            </div>
        </main>
        <Footer />
    </div>
  );
}
