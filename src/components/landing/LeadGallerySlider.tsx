
'use client';

import * as React from 'react';
import Image from 'next/image';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from '@/components/ui/carousel';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeadGallerySlider({ images }: { images: { url: string, hint: string }[] }) {
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
    <div className="relative w-full max-w-xl mx-auto md:max-w-none">
      <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {images.map((image, i) => (
            <CarouselItem key={i}>
              <div className="relative aspect-square rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white bg-muted">
                <Image 
                  src={image.url} 
                  alt={image.hint} 
                  data-ai-hint={image.hint} 
                  fill 
                  className="object-cover" 
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Animated Blinking Arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-white/30 backdrop-blur-md rounded-full p-2 md:p-3 animate-pulse border border-white/40 shadow-lg">
            <ArrowRight className="text-white h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>

        {/* Indicator Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === i ? "bg-white w-5" : "bg-white/50 w-1.5"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
