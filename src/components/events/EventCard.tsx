
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Event } from '@/app/actions/events';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { Download } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = event.date.toDate();
  const day = format(eventDate, 'dd');
  const month = format(eventDate, 'MMM', { locale: id });
  const year = format(eventDate, 'yyyy');

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
                <span className="text-xs font-bold text-primary">{month.toUpperCase()}</span>
                <span className="text-2xl font-bold">{day}</span>
                <span className="text-xs text-muted-foreground">{year}</span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.location}</p>
                 {event.attachmentUrl && (
                    <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link href={event.attachmentUrl} target="_blank">
                           <Download className="mr-2 h-4 w-4" /> {event.attachmentName || 'Lampiran'}
                        </Link>
                    </Button>
                )}
            </div>
            {/* <Button size="sm">Detail</Button> */}
        </div>
    </Card>
  );
}
