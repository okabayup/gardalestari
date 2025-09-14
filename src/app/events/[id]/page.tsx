
'use client';

import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getEvent, Event } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Award, FileText, Globe, Info, Target, Landmark, Download, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface EventDetailPageProps {
  params: { id: string };
}

const InfoCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                {icon}
            </div>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {children}
        </CardContent>
    </Card>
)

const EventDetailClient = ({ event }: { event: Event }) => {
    const router = useRouter();
    const isPast = new Date() > event.date.toDate();
    const [formattedFullDate, setFormattedFullDate] = useState('');
    const [formattedDate, setFormattedDate] = useState('');
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        const formatDate = async () => {
            const { id } = await import('date-fns/locale/id');
            const eventDate = event.date.toDate();
            setFormattedFullDate(format(eventDate, "dd MMMM yyyy, HH:mm", { locale: id }));
            setFormattedDate(format(eventDate, "eeee, dd MMMM yyyy", { locale: id }));
            setFormattedTime(format(eventDate, "HH:mm", { locale: id }));
        };
        formatDate();
    }, [event.date]);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      startDate: event.date.toDate().toISOString(),
      endDate: event.date.toDate().toISOString(),
      description: event.description,
      image: event.imageUrl,
      eventStatus: isPast ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: event.location,
        address: event.location
      },
      organizer: {
        '@type': 'Organization',
        name: 'Garda Lestari',
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
             <div className="p-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
            </div>
            <div className="relative h-48 md:h-64 w-full">
                <Image
                    src={event.imageUrl || 'https://picsum.photos/1200/800'}
                    alt={event.title}
                    data-ai-hint={event.imageHint}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            </div>
            <div className="p-6 -mt-16 relative z-10 space-y-6">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">{event.title}</h1>
                     <p className="text-muted-foreground">{formattedFullDate} WIB</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <InfoCard icon={<Info className="h-6 w-6" />} title="Deskripsi Acara">
                       <p>{event.description}</p>
                    </InfoCard>
                    <InfoCard icon={<Landmark className="h-6 w-6" />} title="Lokasi & Waktu">
                       <ul>
                           <li><strong>Tanggal:</strong> {formattedDate}</li>
                           <li><strong>Waktu:</strong> {formattedTime} WIB</li>
                           <li><strong>Lokasi:</strong> {event.location}</li>
                       </ul>
                    </InfoCard>
                </div>
                 {event.attachmentUrl && (
                    <div className="pt-4">
                        <Button asChild className="w-full">
                            <Link href={event.attachmentUrl} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                {event.attachmentName || 'Unduh Lampiran'}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
        notFound();
        return;
    }
    
    const fetchEvent = async () => {
        setLoading(true);
        const fetchedEvent = await getEvent(eventId);
        if (!fetchedEvent) {
            notFound();
        } else {
            setEvent(fetchedEvent);
        }
        setLoading(false);
    }
    
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
        <MainLayout>
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </MainLayout>
    )
  }
  
  if (!event) {
    return null; // notFound() would have been called
  }
  
  return (
    <MainLayout>
      <EventDetailClient event={event} />
    </MainLayout>
  );
}
