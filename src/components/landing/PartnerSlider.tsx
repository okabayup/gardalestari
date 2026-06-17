
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { Partner } from '@/app/actions/partners';
import { cn } from '@/lib/utils';

interface PartnerSliderProps {
  partners: Partner[];
}

export default function PartnerSlider({ partners }: PartnerSliderProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);

  // Duplicate partners to create a seamless loop effect
  const extendedPartners = [...partners, ...partners];

  return (
    <div className="overflow-hidden mt-6" ref={emblaRef}>
      <div className="flex">
        {extendedPartners.map((partner, index) => (
          <div
            key={`${partner.id}-${index}`}
            className="relative flex-shrink-0 flex-grow-0 basis-1/3 md:basis-1/5 lg:basis-1/6"
            style={{ minWidth: 0 }}
          >
            <div className="p-4 flex justify-center items-center">
               <Link href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                 <Image 
                    src={partner.logoUrl} 
                    alt={partner.name} 
                    title={partner.name} 
                    width={140} 
                    height={70} 
                    className="object-contain h-12 w-auto"
                 />
               </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
