
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sprout, Ship, TreePine, Eye, Shield, Scale, Search, ZoomIn, ZoomOut, Move, Loader2 } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { getAppSettings, AppSettings } from '@/app/actions/settings';
import { Separator } from '@/components/ui/separator';
import { getMembers, MemberWithStatus } from '@/app/actions/user';
import { MemberCard } from '@/components/members/MemberCard';
import { formatFullName } from '@/lib/utils';
import { initialPositions } from '@/lib/definitions';
import { useState, useEffect, useRef, WheelEvent, MouseEvent, TouchEvent } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


const InfoSection = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {children}
        </div>
    </div>
)

const BoardSection = ({ title, members }: { title: string, members: MemberWithStatus[] }) => {
    if (members.length === 0) return null;
    
    return (
        <div>
            <h3 className="font-headline text-xl font-semibold mt-6 mb-4 text-center md:text-left">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
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
        <div className="relative w-full max-w-4xl cursor-zoom-in rounded-lg border-4 border-muted shadow-lg">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1600}
            className="rounded-md"
            data-ai-hint="organization chart"
          />
           <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <ZoomIn className="h-16 w-16 text-white" />
           </div>
        </div>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none p-0 flex items-center justify-center bg-black/80 backdrop-blur-sm border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Bagan Struktur Organisasi</DialogTitle>
          <DialogDescription>
            Tampilan penuh dari bagan struktur organisasi Garda Lestari.
          </DialogDescription>
        </DialogHeader>
        <Image
            src={src}
            alt={alt}
            fill
            className="object-contain rotate-90 md:rotate-0"
        />
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
            getMembers(true), // Fetch public members
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

    // Define the custom sort order
    const positionOrder = initialPositions;

    const sortMembers = (members: MemberWithStatus[]) => {
        return members.sort((a, b) => {
            const indexA = positionOrder.indexOf(a.position || '');
            const indexB = positionOrder.indexOf(b.position || '');
            
            // If one or both positions are not in the list, don't move them relative to each other
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
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>; 
    }


    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingHeader isRegistrationOpen={settings.isRegistrationOpen} />
            <main className="flex-1">
                <section className="relative w-full pt-20 pb-12 md:pt-28 md:pb-20">
                     <div className="absolute inset-0 -z-10">
                        <Image
                            src={settings.aboutImageUrl}
                            alt="Tim Garda Lestari"
                            data-ai-hint="team work community"
                            fill
                            className="object-cover opacity-10"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
                    </div>
                    <div className="container text-center">
                         <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
                            Tentang Garda Lestari
                         </h1>
                         <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
                            Mengenal lebih dekat visi, misi, dan struktur di balik gerakan kami untuk kelestarian Indonesia.
                         </p>
                    </div>
                </section>
                
                <section className="py-16 md:py-20">
                    <div className="container space-y-12">
                        <InfoSection title="Visi & Misi" icon={Eye}>
                            <p><strong>Visi:</strong> Menjadi inkubator terdepan bagi para inovator muda dalam mengembangkan potensi dan solusi di bidang agro-maritim dan kehutanan, dengan fokus pada keberlanjutan dan pembangunan ekonomi yang inklusif.</p>
                            <p><strong>Misi:</strong></p>
                            <ul>
                                <li>Memberdayakan pemuda melalui pelatihan, pendampingan, dan kolaborasi strategis.</li>
                                <li>Mendorong inovasi yang menjawab tantangan di sektor agro-maritim dan kehutanan.</li>
                                <li>Membentuk generasi pemimpin yang tangguh, terampil, dan berintegritas untuk masa depan Indonesia.</li>
                            </ul>
                        </InfoSection>

                        <Separator />

                         <InfoSection title="Lambang Organisasi" icon={Shield}>
                           <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
                                <Image src="/logo.png" alt="Lambang Garda Lestari" width={150} height={150} className="w-32 h-auto md:w-40" />
                                <p className="max-w-prose">Lambang Garda Lestari merepresentasikan komitmen kami. Warna hijau melambangkan kesuburan dan kelestarian, sementara bentuk perisai melambangkan perlindungan terhadap alam. Tunas di tengah adalah simbol dari pemuda yang tumbuh dan berinovasi untuk masa depan yang lebih baik.</p>
                           </div>
                        </InfoSection>

                        <Separator />

                        <InfoSection title="Struktur Organisasi" icon={Scale}>
                             <div className="flex justify-center mb-8">
                                <OrgChartImage
                                  src={settings.orgChartImageUrl}
                                  alt="Struktur Organisasi Garda Lestari"
                                />
                            </div>
                           {dewanKehormatan.length > 0 && <div><BoardSection title="Dewan Kehormatan" members={dewanKehormatan} /></div>}
                           {dpp.length > 0 && <div className="mt-8"><BoardSection title="Dewan Pengurus Pusat (DPP)" members={dpp} /></div>}
                           {dpd.length > 0 && <div className="mt-8"><BoardSection title="Dewan Pengurus Daerah (DPD)" members={dpd} /></div>}
                           {dpc.length > 0 && <div className="mt-8"><BoardSection title="Dewan Pengurus Cabang (DPC)" members={dpc} /></div>}
                        </InfoSection>
                    </div>
                </section>
            </main>
        </div>
    );
}
