'use client';

import * as React from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import BeritaPostCard from '../berita/BeritaPostCard';
import { BeritaPost } from '@/lib/definitions';

interface NewsCarouselProps {
  posts: BeritaPost[];
}

export default function NewsCarousel({ posts }: NewsCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full space-y-8">
      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent className="-ml-4 md:-ml-6">
          {posts.map((post, i) => (
            <CarouselItem key={post.slug} className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="h-full">
                <BeritaPostCard {...post} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden lg:block">
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </div>
      </Carousel>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2.5">
        {posts.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              current === i ? "bg-primary w-8" : "bg-primary/20 w-1.5"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
