
'use client';

import { getBeritaPosts, BeritaPost } from '@/app/actions/berita';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const VideoPostCard = ({ video }: { video: BeritaPost }) => {
  return (
    <Link href={`/video/${video.slug}`}>
      <Card className="overflow-hidden group">
        <CardContent className="relative aspect-video p-0">
          <Image
            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <PlayCircle className="h-12 w-12 text-white/80 group-hover:text-white transition-colors" />
          </div>
           <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-white font-semibold text-sm line-clamp-2">{video.title}</h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};


export default function VideoPage() {
  const [videos, setVideos] = useState<BeritaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBeritaPosts('video').then(data => {
        setVideos(data);
        setLoading(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
        <LandingHeader />
        <main className="flex-1">
            <div className="container py-12 md:py-16">
                <div className="text-center sm:text-left mb-8">
                    <h1 className="font-headline text-3xl font-bold">Galeri Video</h1>
                    <p className="text-muted-foreground">Liputan, wawasan, dan cerita inspiratif dalam format video.</p>
                </div>
                {loading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : videos.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <VideoPostCard key={video.slug} video={video} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">Belum ada video yang dipublikasikan.</p>
                )}
            </div>
        </main>
        <Footer />
    </div>
  );
}
