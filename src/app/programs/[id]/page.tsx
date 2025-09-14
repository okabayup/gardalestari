

'use client';

import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getProgram, Program } from '@/app/actions/programs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Award, FileText, Globe, Info, Target, Landmark, Download, Loader2, ArrowLeft, KanbanSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { logAnalyticsEvent } from '@/lib/analytics';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface ProgramDetailPageProps {
  params: { id: string };
}

const toJsDate = (dateString?: string): Date => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
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

const ProgramDetailClient = ({ program }: { program: Program }) => {
    const router = useRouter();
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
        setIsPast(new Date() > toJsDate(program.endDate));
        logAnalyticsEvent('view_item', {
            item_id: program.id,
            item_name: program.title,
            item_category: 'program',
        });
    }, [program]);

    const deadline = format(toJsDate(program.endDate), "dd MMMM yyyy", { locale: id });
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
        name: 'Online',
      },
      offers: {
        '@type': 'Offer',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/programs/${program.id}`,
        price: '0',
        priceCurrency: 'IDR',
        availability: isPast ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        validFrom: toJsDate(program.startDate).toISOString(),
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
                    <div className="flex flex-wrap gap-2">
                        {program.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">{program.title}</h1>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">Kategori</p>
                            <p className="font-semibold">{program.category === 'flagship' ? 'Unggulan' : 'Berkelanjutan'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Batas Pendaftaran</p>
                            <p className="font-semibold">{deadline}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Jenis Program</p>
                            <p className="font-semibold">{program.programType === 'aktif' ? 'Aktif (Terbuka)' : 'Pasif (Internal)'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Surat Rekomendasi</p>
                            <p className="font-semibold">{program.requiresRecommendation ? 'Tersedia' : 'Tidak Ada'}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <InfoCard icon={<Info className="h-6 w-6" />} title="Deskripsi Program">
                        <div dangerouslySetInnerHTML={{ __html: renderHtml(program.description) }} />
                    </InfoCard>
                    <InfoCard icon={<Award className="h-6 w-6" />} title="Benefit Program">
                        <div dangerouslySetInnerHTML={{ __html: renderHtml(program.benefits) }} />
                    </InfoCard>
                    <InfoCard icon={<FileText className="h-6 w-6" />} title="Berkas Pendaftaran">
                        <div dangerouslySetInnerHTML={{ __html: renderHtml(program.requiredDocuments) }} />
                        {program.attachmentUrl && (
                            <Button asChild variant="outline" className="mt-4" onClick={handleDownloadClick}>
                                <Link href={program.attachmentUrl} target="_blank">
                                    <Download className="mr-2 h-4 w-4" />
                                    {program.attachmentName || 'Unduh Lampiran'}
                                </Link>
                            </Button>
                        )}
                    </InfoCard>
                    <InfoCard icon={<Target className="h-6 w-6" />} title="Informasi Pendaftaran">
                        <ul>
                            <li><strong>Batas Waktu:</strong> {deadline}</li>
                            {program.programType === 'aktif' && <li><strong>Jenis:</strong> {submissionType === 'internal' ? 'Formulir Internal' : 'Situs Eksternal'}</li>}
                            {program.requiresRecommendation && (
                                <li><strong>Surat Rekomendasi:</strong> Garda Lestari dapat menyediakan surat rekomendasi untuk program ini.</li>
                            )}
                        </ul>
                    </InfoCard>
                </div>

                <div className="pt-4">
                    {program.programType === 'pasif' ? (
                        <Button size="lg" className="w-full" disabled>
                           <KanbanSquare className="mr-2 h-4 w-4"/> Lihat Aktivitas Proyek (Segera)
                        </Button>
                    ) : isPast ? (
                        <Button size="lg" className="w-full" disabled>Program Telah Berakhir</Button>
                    ) : submissionType === 'external' ? (
                        <Button size="lg" asChild className="w-full" onClick={handleApplyClick}>
                            <Link href={program.applicationUrl || '#'} target="_blank">
                                Daftar di Situs Eksternal <Globe className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    ) : (
                        <Button size="lg" className="w-full" disabled>
                            Pendaftaran Internal Belum Tersedia
                        </Button>
                    )}
                </div>
            </div>
        </>
    )
}

export default function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id: programId } = params;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
        notFound();
        return;
    }
    
    const fetchProgram = async () => {
        setLoading(true);
        const fetchedProgram = await getProgram(programId);
        if (!fetchedProgram) {
            notFound();
        } else {
            setProgram(fetchedProgram);
        }
        setLoading(false);
    }
    
    fetchProgram();
  }, [programId]);

  if (loading) {
    return (
        <MainLayout>
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </MainLayout>
    )
  }
  
  if (!program) {
    return null; // notFound() would have been called
  }
  
  return (
    <MainLayout>
      <ProgramDetailClient program={program} />
    </MainLayout>
  );
}

    