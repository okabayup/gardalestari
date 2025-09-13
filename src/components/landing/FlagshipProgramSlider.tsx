
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Program } from '@/lib/definitions';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowRight, Globe } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay"

type SerializableProgram = Omit<Program, 'startDate' | 'endDate'> & {
  startDate: string;
  endDate: string;
};

interface FlagshipProgramSliderProps {
  programs: SerializableProgram[];
}

const ProgramSliderCard = ({ program }: { program: SerializableProgram }) => {
    const isExternalSubmission = program.submissionType === 'external' && program.applicationUrl;
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        // Format date only on the client-side after hydration
        setFormattedDate(
            `${format(new Date(program.startDate), "d MMM", { locale: id })} - ${format(new Date(program.endDate), "d MMM yyyy", { locale: id })}`
        );
    }, [program.startDate, program.endDate]);


    const actionButton = isExternalSubmission ? (
        <Button asChild size="sm">
            <Link href={program.applicationUrl!} target="_blank">
                Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    ) : (
         <Button asChild size="sm" variant="secondary">
            <Link href={`/programs/${program.id}`}>
                Lihat Detail <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    );

    return (
        <div className="p-1">
            <Card className="overflow-hidden group">
                <CardContent className="relative aspect-video p-0">
                    <Image
                        src={program.imageUrl}
                        alt={program.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex flex-wrap gap-1 mb-1">
                            {program.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-white/20 text-white border-none">{tag}</Badge>
                            ))}
                        </div>
                        <h3 className="text-white font-bold text-lg line-clamp-2">{program.title}</h3>
                        <p className="text-xs text-white/80 h-4">
                            {formattedDate || 'Memuat tanggal...'}
                        </p>
                    </div>
                </CardContent>
                <div className="p-4 bg-card">
                   {actionButton}
                </div>
            </Card>
        </div>
    )
};


export default function FlagshipProgramSlider({ programs }: FlagshipProgramSliderProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      className="w-full"
    >
      <CarouselContent>
        {programs.map((program) => (
          <CarouselItem key={program.id} className="md:basis-1/2 lg:basis-1/3">
            <ProgramSliderCard program={program} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
