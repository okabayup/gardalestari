

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sprout, Ship, TreePine, Eye, Shield, Scale, Search, ZoomIn, ZoomOut, Move } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { getAppSettings } from '../actions/settings';
import { Separator } from '@/components/ui/separator';
import { getMembers, MemberWithStatus } from '../actions/members';
import { MemberCard } from '@/components/members/MemberCard';
import { formatFullName } from '@/lib/utils';
import { initialPositions } from '@/lib/definitions';
import { useState, useEffect, useRef, WheelEvent, MouseEvent, TouchEvent } from 'react';
import { cn } from '@/lib/utils';


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
                    />
                ))}
            </div>
        </div>
    );
};

const ZoomableImage = ({ src, alt }: { src: string, alt: string }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pinchDistRef = useRef(0);

    const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const newScale = scale - e.deltaY * 0.001;
        setScale(Math.min(Math.max(1, newScale), 5));
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (scale > 1) {
            setIsDragging(true);
            if (imageRef.current) imageRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (imageRef.current) imageRef.current.style.cursor = 'grab';
    };

    const clampOffset = (newOffset: {x: number, y: number}, currentScale: number) => {
        if (!containerRef.current || !imageRef.current) return newOffset;
        
        const rect = containerRef.current.getBoundingClientRect();
        const imgWidth = imageRef.current.offsetWidth * currentScale;
        const imgHeight = imageRef.current.offsetHeight * currentScale;
        
        const maxOffsetX = Math.max(0, (imgWidth - rect.width) / 2 / currentScale);
        const maxOffsetY = Math.max(0, (imgHeight - rect.height) / 2 / currentScale);
        
        return {
            x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffset.x)),
            y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffset.y)),
        };
    };
    
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (isDragging && scale > 1) {
            setOffset(prev => clampOffset({
                x: prev.x + e.movementX / scale,
                y: prev.y + e.movementY / scale
            }, scale));
        }
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            pinchDistRef.current = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        } else if (e.touches.length === 1 && scale > 1) {
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const newDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scaleFactor = newDist / pinchDistRef.current;
            setScale(prev => Math.min(Math.max(1, prev * scaleFactor), 5));
            pinchDistRef.current = newDist;
        } else if (e.touches.length === 1 && isDragging) {
            setOffset(prev => clampOffset({
                x: prev.x + e.touches[0].movementX / scale,
                y: prev.y + e.touches[0].movementY / scale
            }, scale));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        pinchDistRef.current = 0;
    };

    useEffect(() => {
        if (scale === 1) {
            setOffset({ x: 0, y: 0 });
        } else {
             setOffset(prev => clampOffset(prev, scale));
        }
    }, [scale]);

    return (
        <div
            ref={containerRef}
            className="relative w-full max-w-4xl p-2 border-4 border-muted rounded-lg shadow-lg bg-background overflow-hidden cursor-zoom-in touch-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="w-full h-auto transition-transform duration-100 ease-out"
                style={{
                    transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
                    cursor: scale > 1 ? 'grab' : 'zoom-in',
                }}
            >
                <Image
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    width={1200}
                    height={1600}
                    className="rounded-md w-full h-auto"
                    data-ai-hint="organization chart"
                    draggable={false}
                />
            </div>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs pointer-events-none">
                <ZoomIn className="h-3 w-3" />
                <span className="hidden sm:inline">Pinch/Scroll untuk Zoom</span>
                <Move className="h-3 w-3 ml-1" />
                <span className="hidden sm:inline">Geser</span>
            </div>
        </div>
    );
};


export default function AboutPage() {
    const [settings, setSettings] = useState<any>({});
    const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function fetchData() {
        try {
          const [settingsData, membersData] = await Promise.all([
            getAppSettings(),
            getMembers(),
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


    if (loading) {
        return <div>Loading...</div>; // Or a proper skeleton loader
    }


    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingHeader />
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
                                <ZoomableImage
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
