'use client';

import * as React from 'react';
import Image from 'next/image';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Initiative {
  title: string;
  desc: string;
  img: string;
  category: string;
}

interface InitiativesCarouselProps {
  initiatives: Initiative[];
}

export default function InitiativesCarousel({ initiatives }: InitiativesCarouselProps) {
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
    <div className="w-full space-y-10">
      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: true }}>
        <CarouselContent className="-ml-4">
          {initiatives.map((item, i) => (
            <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Card className="rounded-[2.5rem] border-none overflow-hidden group h-full bg-white/5 backdrop-blur-sm">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative aspect-[3/4] w-full">
                    <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:left-10 text-white space-y-3 md:space-y-4">
                      <Badge className="bg-primary/20 backdrop-blur-md border-none text-white px-4 py-1">{item.category}</Badge>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">{item.title}</h3>
                      <Button variant="outline" className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white hover:text-black w-full justify-between px-6 h-12 font-bold backdrop-blur-md transition-all">
                        Temukan Solusi <ArrowRight size={18} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden lg:block">
          <CarouselPrevious className="absolute -left-12 bg-white/10 border-white/20 text-white hover:bg-primary transition-colors" />
          <CarouselNext className="absolute -right-12 bg-white/10 border-white/20 text-white hover:bg-primary transition-colors" />
        </div>
      </Carousel>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2.5">
        {initiatives.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              current === i ? "bg-primary w-8" : "bg-white/20 w-1.5"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}