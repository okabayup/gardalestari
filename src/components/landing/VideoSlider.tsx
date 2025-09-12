
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BeritaPost } from '@/lib/definitions';
import { PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface VideoSliderProps {
  videos: BeritaPost[];
}

export default function VideoSlider({ videos }: VideoSliderProps) {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {videos.map((video) => (
          <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Link href={`/video/${video.slug}`}>
                <Card className="overflow-hidden group">
                  <CardContent className="relative aspect-video p-0">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
