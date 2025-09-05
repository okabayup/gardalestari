
import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getPartner } from '@/app/actions/partners';
import { getProgram, Program } from '@/app/actions/programs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowRight, Award, Briefcase, Calendar, Check, FileText, Globe, Handshake, Info, Target, Landmark, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProgramDetailPageProps {
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

const ProgramSourceInfo = async ({ source, partnerId }: { source: Program['source'], partnerId?: Program['partnerId'] }) => {
    if (source === 'mitra' && partnerId) {
        const partner = await getPartner(partnerId);
        return (
            <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4" />
                <span>Diselenggarakan bersama <span className="font-semibold">{partner?.name || 'Mitra'}</span></span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span>Program Internal Garda Lestari</span>
        </div>
    )
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id: programId } = params;
  if (!programId) notFound();

  const program = await getProgram(programId);
  if (!program) notFound();
  
  const isPast = new Date() > program.endDate.toDate();
  const deadline = format(program.endDate.toDate(), "dd MMMM yyyy", { locale: id });
  const submissionType = program.submissionType || 'external';

  const renderHtml = (text: string) => {
    const listItems = text.split('\n').filter(line => line.trim() !== '').map((item, index) => {
        // Simple check for list-like lines
        if (item.trim().startsWith('-') || item.trim().startsWith('*')) {
            return `<li key=${index}>${item.trim().substring(1).trim()}</li>`;
        }
        return `<p key=${index}>${item}</p>`;
    }).join('');

    // If any list items were found, wrap in a <ul>
    return text.includes('- ') || text.includes('* ') ? `<ul>${listItems}</ul>` : listItems;
  }

  return (
    <MainLayout>
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
            <div className="text-muted-foreground text-sm">
                <ProgramSourceInfo source={program.source} partnerId={program.partnerId} />
            </div>
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
                    <p className="text-xs text-muted-foreground">Jenis Pendaftaran</p>
                    <p className="font-semibold">{submissionType === 'internal' ? 'Internal' : 'Eksternal'}</p>
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
                    <Button asChild variant="outline" className="mt-4">
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
                    <li><strong>Jenis:</strong> {submissionType === 'internal' ? 'Formulir Internal' : 'Situs Eksternal'}</li>
                    {program.requiresRecommendation && (
                        <li><strong>Surat Rekomendasi:</strong> Garda Lestari dapat menyediakan surat rekomendasi untuk program ini.</li>
                    )}
                </ul>
            </InfoCard>
        </div>

         <div className="pt-4">
            {isPast ? (
                <Button size="lg" className="w-full" disabled>Program Telah Berakhir</Button>
            ) : submissionType === 'external' ? (
                <Button size="lg" asChild className="w-full">
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
    </MainLayout>
  );
}
