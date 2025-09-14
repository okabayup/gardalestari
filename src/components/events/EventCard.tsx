
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Event } from '@/app/actions/events';
import { format } from 'date-fns';
import Link from 'next/link';
import { Download, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = event.date.toDate();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    const formatDate = async () => {
      const { id } = await import('date-fns/locale/id');
      setDay(format(eventDate, 'dd', { locale: id }));
      setMonth(format(eventDate, 'MMM', { locale: id }));
      setYear(format(eventDate, 'yyyy', { locale: id }));
    };
    formatDate();
  }, [eventDate]);

  return (
    <Card className="overflow-hidden">
        <div className="relative h-32 w-full">
            <Image
            src={event.imageUrl}
            alt={event.title}
            data-ai-hint={event.imageHint}
            fill
            className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="p-4 flex items-center gap-4">
            <div className="flex flex-col items-center text-center w-16">
                <span className="text-xs font-bold text-primary">{month.toUpperCase() || '...'}</span>
                <span className="text-2xl font-bold">{day || '00'}</span>
                <span className="text-xs text-muted-foreground">{year || '...'}</span>
            </div>
            <div className="flex-1 space-y-2">
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.location}</p>
                 <Button size="sm" asChild variant="secondary">
                  <Link href={`/events/${event.id}`}>
                    Lihat Detail
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </div>
        </div>
    </Card>
  );
}
