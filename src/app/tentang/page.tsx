
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sprout, Ship, TreePine, Eye, Shield, Scale } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { getAppSettings } from '../actions/settings';
import { Separator } from '@/components/ui/separator';
import { getMembers, MemberWithStatus } from '../actions/members';
import { MemberCard } from '@/components/members/MemberCard';
import { formatFullName } from '@/lib/utils';


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

const BoardSection = ({ title, members }: { title: string, members: MemberWithStatus[] }) => (
    <div>
        <h3 className="font-headline text-xl font-semibold mt-6 mb-4">{title}</h3>
        {members.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        ) : (
            <p className="text-sm text-muted-foreground">Data anggota untuk dewan ini akan segera ditampilkan.</p>
        )}
    </div>
);

const ExecutiveBoardSection = ({ title, members }: { title: string, members: MemberWithStatus[] }) => {
    if (members.length === 0) return null;

    return (
        <div>
            <h3 className="font-headline text-xl font-semibold mt-6 mb-4">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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


export default async function AboutPage() {
    const settings = await getAppSettings();
    const members = await getMembers();

    const dewanKehormatan = members.filter(m => ['pembina', 'pengawas', 'penasehat'].includes(m.type || ''));
    const dpp = members.filter(m => m.type === 'pusat');
    const dpd = members.filter(m => m.type === 'daerah');
    const dpc = members.filter(m => m.type === 'cabang');


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
                           <div className="flex flex-col md:flex-row items-center gap-6">
                                <Image src="/logo.png" alt="Lambang Garda Lestari" width={150} height={150} className="w-40 h-auto" />
                                <p>Lambang Garda Lestari merepresentasikan komitmen kami. Warna hijau melambangkan kesuburan dan kelestarian, sementara bentuk perisai melambangkan perlindungan terhadap alam. Tunas di tengah adalah simbol dari pemuda yang tumbuh dan berinovasi untuk masa depan yang lebih baik.</p>
                           </div>
                        </InfoSection>

                        <Separator />

                        <InfoSection title="Struktur Organisasi" icon={Scale}>
                             <div className="flex justify-center mb-8">
                                <div className="relative w-full max-w-4xl p-2 border-4 border-muted rounded-lg shadow-lg bg-background">
                                    <Image 
                                        src={settings.orgChartImageUrl} 
                                        alt="Struktur Organisasi Garda Lestari" 
                                        width={1200}
                                        height={1600}
                                        className="rounded-md w-full h-auto"
                                        data-ai-hint="organization chart"
                                    />
                                </div>
                            </div>
                           <div>
                                <BoardSection title="Dewan Kehormatan" members={dewanKehormatan} />
                            </div>
                            <div className="mt-8">
                                <ExecutiveBoardSection title="Dewan Pengurus Pusat (DPP)" members={dpp} />
                                <ExecutiveBoardSection title="Dewan Pengurus Daerah (DPD)" members={dpd} />
                                <ExecutiveBoardSection title="Dewan Pengurus Cabang (DPC)" members={dpc} />
                            </div>
                        </InfoSection>
                    </div>
                </section>
            </main>
        </div>
    );
}
