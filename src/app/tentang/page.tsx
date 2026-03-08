'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sprout, Ship, TreePine, Eye, Shield, Scale, Search, ZoomIn, ZoomOut, Move, Loader2, Sparkles, Target, Users } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getAppSettings, AppSettings } from '@/app/actions/settings';
import { Separator } from '@/components/ui/separator';
import { getMembers, MemberWithStatus } from '@/app/actions/user';
import { MemberCard } from '@/components/members/MemberCard';
import { formatFullName } from '@/lib/utils';
import { initialPositions } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const InfoSection = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="p-4 bg-primary/10 rounded-3xl text-primary shrink-0">
                <Icon className="h-8 w-8" />
            </div>
            <h2 className="font-black text-3xl md:text-4xl tracking-tighter text-accent">{title}</h2>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed font-medium">
            {children}
        </div>
    </div>
)

const BoardSection = ({ title, members }: { title: string, members: MemberWithStatus[] }) => {
    if (members.length === 0) return null;
    
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-accent shrink-0">{title}</h3>
                <div className="h-px bg-border flex-1" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {members.map(member => (
                    <MemberCard 
                        key={member.id} 
                        name={member.name} 
                        position={member.position || 'Anggota'} 
                        avatarUrl={member.avatarUrl}
                        titlePrefix={member.titlePrefix}
                        titlePostfix={member.titlePostfix}
                        username={member.username}
                    />
                ))}
            </div>
        </div>
    );
};

const OrgChartImage = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative w-full max-w-4xl cursor-zoom-in rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl group">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1600}
            className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
          />
           <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/30 backdrop-blur-md rounded-full p-4">
                <ZoomIn className="h-10 w-10 text-white" />
              </div>
           </div>
        </div>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none p-0 flex items-center justify-center bg-black/90 backdrop-blur-sm border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Bagan Struktur Organisasi</DialogTitle>
          <DialogDescription>Tampilan penuh bagan organisasi.</DialogDescription>
        </DialogHeader>
        <Image src={src} alt={alt} fill className="object-contain" />
      </DialogContent>
    </Dialog>
  );
};

export default function AboutPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function fetchData() {
        try {
          const [settingsData, membersData] = await Promise.all([
            getAppSettings(),
            getMembers(true),
          ]);
          setSettings(settingsData);
          setAllMembers(membersData);
        } catch (error) {
          console.error("Failed to fetch page data", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, []);

    const positionOrder = initialPositions;
    const sortMembers = (members: MemberWithStatus[]) => {
        return members.sort((a, b) => {
            const indexA = positionOrder.indexOf(a.position || '');
            const indexB = positionOrder.indexOf(b.position || '');
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }

    const dewanKehormatan = sortMembers(allMembers.filter(m => ['pembina', 'pengawas', 'penasehat'].includes(m.type || '')));
    const dpp = sortMembers(allMembers.filter(m => m.type === 'pusat'));
    const dpd = sortMembers(allMembers.filter(m => m.type === 'daerah'));
    const dpc = sortMembers(allMembers.filter(m => m.type === 'cabang'));

    if (loading || !settings) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>; 
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingHeader />
            <main className="flex-1">
                {/* Hero Header */}
                <section className="relative w-full pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#1B3022]">
                     <div className="absolute inset-0 opacity-20">
                        <Image
                            src={settings.aboutImageUrl}
                            alt="Tim Garda Lestari"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="container relative z-10 text-center space-y-6">
                         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            <Users size={14} /> Berkenalan Lebih Dekat
                         </div>
                         <h1 className="font-black text-4xl sm:text-6xl md:text-8xl tracking-tighter text-white leading-none">
                            Tentang <span className="text-primary">Garda Lestari</span>
                         </h1>
                         <p className="mx-auto max-w-2xl text-lg text-white/70 md:text-xl font-medium">
                            Menyatukan semangat pemuda Indonesia untuk inovasi keberlanjutan di sektor agro-maritim dan kehutanan nusantara.
                         </p>
                    </div>
                </section>
                
                {/* Content Sections */}
                <section className="py-20 md:py-32">
                    <div className="container max-w-5xl space-y-24 md:space-y-32 px-6">
                        <InfoSection title="Visi & Misi" icon={Eye}>
                            <div className="grid md:grid-cols-2 gap-12">
                                <Card className="organic-card p-8 space-y-4 border-none shadow-xl bg-white">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Target /></div>
                                    <h3 className="font-black text-2xl text-accent">Visi Kami</h3>
                                    <p className="text-muted-foreground leading-relaxed">Menjadi inkubator terdepan bagi para inovator muda dalam mengembangkan potensi dan solusi di bidang agro-maritim dan kehutanan, dengan fokus pada keberlanjutan.</p>
                                </Card>
                                <Card className="organic-card p-8 space-y-4 border-none shadow-xl bg-white">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Sparkles /></div>
                                    <h3 className="font-black text-2xl text-accent">Misi Kami</h3>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex gap-3"><CheckCircle className="text-primary h-5 w-5 shrink-0" /> Memberdayakan pemuda melalui pelatihan dan kolaborasi strategis.</li>
                                        <li className="flex gap-3"><CheckCircle className="text-primary h-5 w-5 shrink-0" /> Mendorong inovasi yang menjawab tantangan sektor agro-maritim.</li>
                                        <li className="flex gap-3"><CheckCircle className="text-primary h-5 w-5 shrink-0" /> Membentuk pemimpin generasi baru yang terampil dan berintegritas.</li>
                                    </ul>
                                </Card>
                            </div>
                        </InfoSection>

                        <InfoSection title="Identitas Organisasi" icon={Shield}>
                           <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="shrink-0 p-8 bg-muted/30 rounded-[3rem] border border-border/50">
                                    <Image src="/logo.png" alt="Lambang Garda Lestari" width={200} height={200} className="w-40 h-auto md:w-56" />
                                </div>
                                <div className="space-y-4 text-center md:text-left">
                                    <p className="text-lg leading-relaxed">Lambang Garda Lestari merepresentasikan komitmen kami. Warna <span className="text-primary font-bold">hijau</span> melambangkan kesuburan, sementara bentuk <span className="text-accent font-bold">perisai</span> melambangkan perlindungan terhadap alam.</p>
                                    <p className="text-muted-foreground italic">"Tunas di tengah adalah simbol dari pemuda yang terus tumbuh dan berinovasi demi masa depan yang lebih baik."</p>
                                </div>
                           </div>
                        </InfoSection>

                        <InfoSection title="Struktur & Kepengurusan" icon={Scale}>
                             <div className="flex flex-col items-center gap-16">
                                <OrgChartImage
                                  src={settings.orgChartImageUrl}
                                  alt="Struktur Organisasi Garda Lestari"
                                />
                                
                                <div className="w-full space-y-20">
                                    {dewanKehormatan.length > 0 && <BoardSection title="Dewan Kehormatan" members={dewanKehormatan} />}
                                    {dpp.length > 0 && <BoardSection title="Dewan Pengurus Pusat (DPP)" members={dpp} />}
                                    {dpd.length > 0 && <BoardSection title="Dewan Pengurus Daerah (DPD)" members={dpd} />}
                                    {dpc.length > 0 && <BoardSection title="Dewan Pengurus Cabang (DPC)" members={dpc} />}
                                </div>
                            </div>
                        </InfoSection>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}