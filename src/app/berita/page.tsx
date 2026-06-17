'use server';

import { getBeritaPosts } from '@/app/actions/berita';
import BeritaPostCard from '@/components/berita/BeritaPostCard';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Newspaper } from 'lucide-react';

export default async function BeritaPage() {
  const posts = await getBeritaPosts('artikel', false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
        <LandingHeader />
        <main className="flex-1">
            {/* Header Section */}
            <section className="bg-muted/30 pt-32 pb-16 md:pt-40 md:pb-24 rounded-b-[3rem] md:rounded-b-[5rem]">
                <div className="container px-6 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                        <Newspaper size={14} /> Sorotan Publikasi
                    </div>
                    <h1 className="font-black text-4xl md:text-6xl tracking-tighter text-accent leading-tight">
                        Warta <span className="text-primary">Garda Lestari</span>
                    </h1>
                    <p className="mx-auto max-w-xl text-muted-foreground font-medium">
                        Cerita inspiratif, wawasan mendalam, dan laporan aksi nyata langsung dari lapangan.
                    </p>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="py-16 md:py-24">
                <div className="container px-6">
                    {posts.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post) => (
                                <BeritaPostCard key={post.slug} {...post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
                            <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                            <p className="text-muted-foreground font-bold">Belum ada berita yang dipublikasikan saat ini.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
        <Footer />
    </div>
  );
}