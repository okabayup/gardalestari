
'use client';

import { notFound, useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getEvent, Event } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Award, FileText, Globe, Info, Target, Landmark, Download, Loader2, ArrowLeft, KanbanSquare, QrCode, Users, UserCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { logAnalyticsEvent } from '@/lib/analytics';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Timestamp } from 'firebase/firestore';


interface EventDetailPageProps {
  params: { id: string };
}

const toJsDate = (date?: Date): Date => {
  if (!date) return new Date();
  return date;
};


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

const AttendanceList = ({ attendees, guests }: { attendees?: { userId: string, userName: string, timestamp: Timestamp }[], guests?: { name: string, email: string, phone?: string, timestamp: Timestamp }[] }) => {
    return (
        <Tabs defaultValue="members">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Anggota ({attendees?.length || 0})</TabsTrigger>
                <TabsTrigger value="guests">Tamu ({guests?.length || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Anggota</TableHead>
                            <TableHead>Waktu Absen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendees && attendees.length > 0 ? (
                            attendees.map(a => (
                                <TableRow key={a.userId}>
                                    <TableCell>{a.userName}</TableCell>
                                    <TableCell>{format(a.timestamp.toDate(), 'HH:mm')}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Belum ada anggota yang hadir.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TabsContent>
            <TabsContent value="guests">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Tamu</TableHead>
                            <TableHead>Email</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guests && guests.length > 0 ? (
                            guests.map((g, i) => (
                                <TableRow key={i}>
                                    <TableCell>{g.name}</TableCell>
                                    <TableCell>{g.email}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Belum ada tamu yang hadir.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TabsContent>
        </Tabs>
    )
}

const EventDetailClient = ({ event }: { event: Event }) => {
    const router = useRouter();
    const [isPast, setIsPast] = useState(false);
    const [formattedFullDate, setFormattedFullDate] = useState('');
    const [formattedDate, setFormattedDate] = useState('');
    const [formattedTime, setFormattedTime] = useState('');
    const [attendanceUrl, setAttendanceUrl] = useState('');

    useEffect(() => {
        setIsPast(new Date() > toJsDate(program.endDate));
        logAnalyticsEvent('view_item', {
            item_id: program.id,
            item_name: program.title,
            item_category: 'event',
        });
        setAttendanceUrl(`${window.location.origin}/events/${event.id}/absen`);
    }, [event]);

    useEffect(() => {
        const formatDate = async () => {
            const { id } = await import('date-fns/locale/id');
            const eventDate = toJsDate(event.startDate);
            setFormattedFullDate(format(eventDate, "dd MMMM yyyy, HH:mm", { locale: id }));
            setFormattedDate(format(eventDate, "eeee, dd MMMM yyyy", { locale: id }));
            setFormattedTime(format(eventDate, "HH:mm", { locale: id }));
        };
        formatDate();
    }, [event.startDate]);
    

    const { ...program } = event;
    const submissionType = program.submissionType || 'external';

    const renderHtml = (text: string) => {
        if (!text) return '';
        const listItems = text.split('\n').filter(line => line.trim() !== '').map((item, index) => {
            if (item.trim().startsWith('-') || item.trim().startsWith('*')) {
                return `<li key=${index}>${item.trim().substring(1).trim()}</li>`;
            }
            return `<p key=${index}>${item}</p>`;
        }).join('');
        return text.includes('- ') || text.includes('* ') ? `<ul>${listItems}</ul>` : listItems;
    }

    const handleApplyClick = () => {
        logAnalyticsEvent('button_click', {
            button_name: 'Apply For Program',
            program_id: program.id,
            program_title: program.title,
        });
    };
    
    const handleDownloadClick = () => {
        logAnalyticsEvent('button_click', {
            button_name: 'Download Attachment',
            program_id: program.id,
            program_title: program.title,
        });
    }
    
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: program.title,
      startDate: toJsDate(program.startDate).toISOString(),
      endDate: toJsDate(program.endDate).toISOString(),
      description: program.description,
      image: program.imageUrl,
      eventStatus: isPast ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: program.location,
        address: program.location
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
                    src={program.imageUrl || 'https://picsum.photos/1200/800'}
                    alt={program.title}
                    data-ai-hint={program.imageHint}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            </div>
            <div className="p-6 -mt-16 relative z-10 space-y-6">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">{program.title}</h1>
                     <p className="text-muted-foreground">{formattedFullDate} WIB</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <InfoCard icon={<Info className="h-6 w-6" />} title="Deskripsi Acara">
                       <p>{program.description}</p>
                    </InfoCard>
                    <InfoCard icon={<Landmark className="h-6 w-6" />} title="Lokasi & Waktu">
                       <ul>
                           <li><strong>Tanggal:</strong> {formattedDate}</li>
                           <li><strong>Waktu:</strong> {formattedTime} WIB</li>
                           <li><strong>Lokasi:</strong> {program.location}</li>
                       </ul>
                    </InfoCard>
                </div>
                 {program.attachmentUrl && (
                    <div className="pt-4">
                        <Button asChild className="w-full">
                            <Link href={program.attachmentUrl} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                {program.attachmentName || 'Unduh Lampiran'}
                            </Link>
                        </Button>
                    </div>
                )}
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <QrCode className="mr-2 h-4 w-4"/> Tampilkan Kode QR Absen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Scan untuk Absensi</DialogTitle>
                            <DialogDescription>
                                Arahkan kamera ponsel Anda ke kode QR ini untuk mencatat kehadiran.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-4 bg-white">
                            <QRCode value={attendanceUrl} size={256} />
                        </div>
                    </DialogContent>
                </Dialog>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Daftar Kehadiran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AttendanceList attendees={event.attendeeIds} guests={event.guestAttendees} />
                    </CardContent>
                </Card>
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
