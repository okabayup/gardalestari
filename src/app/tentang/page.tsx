
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sprout, Ship, TreePine, Eye, Shield, Scale } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { getAppSettings } from '../actions/settings';
import { Separator } from '@/components/ui/separator';

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


export default async function AboutPage() {
    const settings = await getAppSettings();

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
                            <p>Garda Lestari dipimpin oleh struktur yang kolaboratif dan dinamis, memastikan setiap program berjalan dengan efektif. Berikut adalah bagan struktur organisasi kami.</p>
                             <div className="flex justify-center mt-6">
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
                        </InfoSection>

                        <Separator />

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                             <Card className="text-center">
                                <CardHeader>
                                    <CardTitle>Dewan Kehormatan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Tokoh-tokoh yang memberikan arahan dan nasihat strategis bagi Garda Lestari.</p>
                                </CardContent>
                             </Card>
                             <Card className="text-center">
                                <CardHeader>
                                    <CardTitle>Dewan Pengurus Pusat (DPP)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Bertanggung jawab atas operasional dan program skala nasional.</p>
                                </CardContent>
                             </Card>
                              <Card className="text-center">
                                <CardHeader>
                                    <CardTitle>Dewan Pengurus Daerah (DPD/DPC)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Perwakilan kami di tingkat provinsi dan kota/kabupaten yang menjalankan program lokal.</p>
                                </CardContent>
                             </Card>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
