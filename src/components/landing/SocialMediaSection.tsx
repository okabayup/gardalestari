'use client';

import React, { useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Instagram, Sparkles } from 'lucide-react';
import Script from 'next/script';
import { cn } from '@/lib/utils';

const TikTokEmbed = ({ url, videoId }: { url: string; videoId: string }) => {
  return (
    <div className="flex justify-center w-full px-2">
      <blockquote
        className="tiktok-embed rounded-[2rem] overflow-hidden shadow-2xl border-4 border-accent/10"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: '605px', minWidth: '325px' }}
      >
        <section>
          <a target="_blank" title="@garda.lestari" href="https://www.tiktok.com/@garda.lestari?refer=embed">
            @garda.lestari
          </a>
        </section>
      </blockquote>
    </div>
  );
};

export default function SocialMediaSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const tiktokVideos = [
    {
      url: 'https://www.tiktok.com/@garda.lestari/video/7587246464246582535',
      id: '7587246464246582535',
    },
    {
      url: 'https://www.tiktok.com/@garda.lestari/video/7597325759593729287',
      id: '7597325759593729287',
    }
  ];

  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="py-20 md:py-32 bg-muted/20 overflow-hidden">
      <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">
            <Instagram size={14} /> Sorotan Media Sosial
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-accent">Aksi di Balik Layar</h2>
          <p className="max-w-xl text-muted-foreground font-medium">
            Ikuti perjalanan kami secara real-time melalui platform sosial. Dari lapangan hingga inovasi laboratorium.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <Carousel setApi={setApi} opts={{ align: 'center', loop: true }} className="w-full">
            <CarouselContent>
              {tiktokVideos.map((video, i) => (
                <CarouselItem key={i} className="basis-full md:basis-1/2 lg:basis-1/2">
                  <div className="p-1">
                    <TikTokEmbed url={video.url} videoId={video.id} />
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      <Sparkles size={12} /> Video Pilihan #{i + 1}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12 bg-white/50 hover:bg-white" />
              <CarouselNext className="-right-12 bg-white/50 hover:bg-white" />
            </div>
          </Carousel>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2.5 mt-8">
            {tiktokVideos.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  current === i ? "bg-primary w-8" : "bg-primary/20 w-2"
                )}
                aria-label={`Buka slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
