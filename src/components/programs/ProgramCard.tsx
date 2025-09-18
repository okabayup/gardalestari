

'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ArrowRight } from 'lucide-react';
import type { Program } from '@/app/actions/programs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface ProgramCardProps extends Program {
  isPast?: boolean;
}

export default function ProgramCard({ id, title, description, imageUrl, imageHint, tags, startDate, endDate, isPast, programType }: ProgramCardProps) {
  const [formattedStartDate, setFormattedStartDate] = useState('');
  const [formattedEndDate, setFormattedEndDate] = useState('');
  
  useEffect(() => {
    const formatDate = async () => {
      const { id } = await import('date-fns/locale/id');
      if (startDate) {
        setFormattedStartDate(format(new Date(startDate), "d MMM yyyy", { locale: id }));
      }
      if (endDate) {
        setFormattedEndDate(format(new Date(endDate), "d MMM yyyy", { locale: id }));
      }
    };
    formatDate();
  }, [startDate, endDate]);

  const buttonText = isPast 
    ? 'Telah Berakhir' 
    : !endDate ? 'Lihat Detail' 
    : programType === 'pasif' 
    ? 'Lihat Detail' 
    : 'Daftar Program';

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg flex flex-col", isPast && "opacity-70")}>
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={title}
          data-ai-hint={imageHint}
          fill
          className="object-cover"
        />
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded">Telah Berakhir</span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {endDate && (
          <div className="flex items-center text-sm text-muted-foreground pt-1">
            <CalendarIcon className="mr-2 h-4 w-4"/>
            <span>{formattedStartDate || '...'} - {formattedEndDate || '...'}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-muted-foreground text-sm mb-4 flex-grow">{description.substring(0, 100)}...</p>
        <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
      </CardContent>
      <div className="p-4 pt-0">
          <Button asChild className="w-full" disabled={isPast}>
              <Link href={`/programs/${id}`}>
                  {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
      </div>
    </Card>
  );
}
