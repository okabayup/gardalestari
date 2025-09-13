

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Sprout, Ship, TreePine, Handshake, HandHeart, Target, Newspaper, Calendar, Heart, ArrowRight, Briefcase, Award, TrendingUp, Lightbulb, BadgeCheck, FileCheck, Video } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { getAppSettings } from './actions/settings';
import { getEvents } from './actions/events';
import { getPrograms } from './actions/programs';
import { getMembers } from './actions/members';
import { getPartners } from './actions/partners';
import { getBeritaPosts } from './actions/berita';
import { Separator } from '@/components/ui/separator';
import BeritaPostCard from '@/components/berita/BeritaPostCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import PartnerSlider from '@/components/landing/PartnerSlider';
import VideoSlider from '@/components/landing/VideoSlider';
import Footer from '@/components/landing/Footer';
import FlagshipProgramSlider from '@/components/landing/FlagshipProgramSlider';


const StatCard = ({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) => (
    <div className="flex flex-col items-center text-center">
        <div className="text-primary">{icon}</div>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
    </div>
);

const corePrograms = [
    { title: "Akses Pendanaan Proyek Sosial & Bisnis", icon: Award },
    { title: "Magang Lestari", icon: Briefcase },
    { title: "Job Lestari", icon: Users },
    { title: "Audiensi Lestari", icon: Handshake },
    { title: "Carbon Credit", icon: TrendingUp },
    { title: "Inkubasi & Akselerasi", icon: Lightbulb }
];


export default async function LandingPage() {
  const settings = await getAppSettings();
  const events = await getEvents();
  const allPrograms = await getPrograms();
  const members = await getMembers();
  const partners = await getPartners();
  const allPosts = await getBeritaPosts();
  
  const flagshipPrograms = allPrograms.filter(p => p.category === 'flagship');
  const featuredArticles = allPosts.filter(p => p.type === 'artikel' && p.isFeatured).slice(0,3);
  const featuredVideos = allPosts.filter(p => p.type === 'video' && p.isFeatured);

  const featuredPartners = partners.filter(p => p.isFeatured);
  const WHATSAPP_LINK = `https://wa.me/${process.env.WHATSAPP_NUMBER || '6285176752610'}`;

  const totalMembers = members.length + (settings.dummyMembers || 0);
  const totalPrograms = allPrograms.length + (settings.dummyPrograms || 0);
  const totalEvents = events.length + (settings.dummyEvents || 0);
  const totalNews = allPosts.length + (settings.dummyNews || 0);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader isRegistrationOpen={settings.isRegistrationOpen} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full pt-24 md:pt-32 lg:pt-40 pb-16 md:pb-20">
          <div className="container text-center">
            <div className="absolute inset-0 -z-10">
                <Image
                    src={settings.heroImageUrl}
                    alt="Lanskap pertanian Indonesia"
                    data-ai-hint="indonesian paddy field"
                    fill
                    className="object-cover opacity-10"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
                  Aksi Nyata Anda untuk Bumi, Dimulai dari Sini.
                </h1>
                <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
                  Garda Lestari adalah wadah bagi Anda yang peduli dan ingin beraksi untuk kelestarian agro, maritim, dan kehutanan Indonesia.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  {settings.isRegistrationOpen && (
                    <Button size="lg" asChild className="shadow-lg">
                        <Link href="/register">Bergabunglah dengan Gerakan Kami</Link>
                    </Button>
                  )}
                  <Button size="lg" variant="outline" asChild>
                      <Link href={WHATSAPP_LINK} target="_blank">Dukung Misi Kami</Link>
                  </Button>
                  <Button size="lg" variant="ghost" asChild>
                      <Link href={WHATSAPP_LINK} target="_blank">Jalin Kemitraan</Link>
                  </Button>
                </div>
            </div>
            
            {featuredPartners.length > 0 && (
                <div className="mt-16 md:mt-24 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Dipercaya dan Didukung Oleh</h3>
                    <PartnerSlider partners={featuredPartners} />
                </div>
            )}
          </div>
        </section>
        
        {/* Impact Section */}
        <section id="impact" className="w-full bg-secondary py-16 md:py-20">
          <div className="container">
              <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
                  <StatCard icon={<Users size={32} />} value={`${totalMembers.toLocaleString()}+`} label="Anggota Aktif" />
                  <StatCard icon={<Sprout size={32} />} value={`${totalPrograms}+`} label="Program Berjalan" />
                  <StatCard icon={<Calendar size={32} />} value={`${totalEvents}+`} label="Acara Terselenggara" />
                  <StatCard icon={<Newspaper size={32} />} value={`${totalNews}+`} label="Publikasi & Riset" />
              </div>
          </div>
        </section>


        {/* About Section */}
        <section id="about" className="w-full bg-background py-16 md:py-28 overflow-hidden">
            <div className="container grid gap-12 md:grid-cols-2 md:items-center">
                <div className="relative h-80 w-full md:h-full rounded-lg overflow-hidden animate-in fade-in slide-in-from-left-24 duration-1000 shadow-lg">
                    <Image src={settings.aboutImageUrl} alt="Pemuda bertani" data-ai-hint="youth farming community" fill className="object-cover" />
                </div>
                <div className="space-y-4 animate-in fade-in slide-in-from-right-24 duration-1000">
                    <span className="text-sm font-semibold uppercase text-primary">Tentang Garda Lestari</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Garda Muda Lestari: Inovasi untuk Negeri</h2>
                    <p className="text-muted-foreground">Kami adalah perkumpulan yang berdedikasi untuk pemberdayaan pemuda Indonesia. Kami berfungsi sebagai inkubator bagi para inovator muda untuk mengembangkan potensi dan solusi mereka di bidang agro-maritim dan kehutanan, dengan penekanan kuat pada keberlanjutan dan pembangunan ekonomi yang inklusif.</p>
                     <Button asChild>
                        <Link href="/tentang">
                           Selengkapnya Tentang Kami <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>

        <Separator />

        {/* Core Focus Section */}
        <section id="focus" className="w-full bg-background py-16 md:py-28 overflow-hidden">
          <div className="container">
            <div className="mb-14 text-center animate-in fade-in zoom-in-95 duration-500">
              <span className="text-sm font-semibold uppercase text-primary">Fokus Kami</span>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl mt-2">Pilar Pembangunan Berkelanjutan</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Kami memusatkan sumber daya pada tiga sektor kunci yang vital bagi masa depan Indonesia.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="text-left p-6 transition-transform transform hover:scale-105 hover:shadow-xl duration-300">
                <Sprout size={32} className="text-primary mb-4" />
                <h3 className="font-headline text-xl mb-2">Agrikultur Cerdas</h3>
                <p className="text-muted-foreground text-sm">Mengembangkan pertanian berkelanjutan melalui inovasi teknologi, praktik ramah lingkungan, dan peningkatan produktivitas untuk mendukung ketahanan pangan.</p>
              </Card>
              <Card className="text-left p-6 transition-transform transform hover:scale-105 hover:shadow-xl duration-300">
                <Ship size={32} className="text-primary mb-4" />
                <h3 className="font-headline text-xl mb-2">Maritim Berdaya</h3>
                <p className="text-muted-foreground text-sm">Memberdayakan potensi kelautan dan perikanan melalui pengelolaan sumber daya laut yang bertanggung jawab dan pengembangan ekonomi biru.</p>
              </Card>
              <Card className="text-left p-6 transition-transform transform hover:scale-105 hover:shadow-xl duration-300">
                <TreePine size={32} className="text-primary mb-4" />
                <h3 className="font-headline text-xl mb-2">Hutan Lestari</h3>
                <p className="text-muted-foreground text-sm">Melestarikan ekosistem hutan melalui kegiatan konservasi, rehabilitasi, dan pemberdayaan masyarakat adat untuk pemanfaatan yang berkelanjutan.</p>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Flagship Programs Section */}
        <section id="programs" className="w-full bg-secondary py-16 md:py-28">
            <div className="container">
              <div className="mb-14 text-center">
                <span className="text-sm font-semibold uppercase text-primary">Program Unggulan</span>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl mt-2">Inisiatif Utama Kami</h2>
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Program-program inti yang kami tawarkan untuk pengembangan anggota dan inovasi.</p>
              </div>
              
              {flagshipPrograms.length > 0 && (
                <div className="mb-12">
                  <FlagshipProgramSlider programs={flagshipPrograms} />
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {corePrograms.map((program) => (
                    <div key={program.title} className="p-4 text-center flex flex-col items-center justify-center">
                      <program.icon className="h-7 w-7 text-primary mb-2"/>
                      <p className="font-semibold text-xs">{program.title}</p>
                    </div>
                ))}
              </div>

               <div className="mt-12 text-center">
                <Button asChild>
                  <Link href="/programs">
                    Lihat Semua Program <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
        </section>
        
        {/* Featured Videos Section */}
        <section id="video" className="w-full bg-background py-16 md:py-28">
          <div className="container">
             <div className="mb-14 text-center">
              <span className="text-sm font-semibold uppercase text-primary">Video Unggulan</span>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl mt-2">Liputan & Cerita Visual</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Tonton cerita inspiratif dan liputan kegiatan kami langsung dari lapangan.</p>
            </div>
            {featuredVideos.length > 0 ? (
              <VideoSlider videos={featuredVideos} />
            ) : (
              <p className="text-center text-muted-foreground">Belum ada video unggulan.</p>
            )}
             <div className="mt-12 text-center">
              <Button asChild>
                <Link href="/video">
                  Lihat Semua Video <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Latest News Section */}
        <section id="news" className="w-full bg-secondary py-16 md:py-28">
          <div className="container">
            <div className="mb-14 text-center">
              <span className="text-sm font-semibold uppercase text-primary">Kabar Terbaru</span>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl mt-2">Berita &amp; Wawasan</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Ikuti perkembangan terbaru dari program, acara, dan riset yang kami lakukan.</p>
            </div>
            
            {featuredArticles.length > 0 ? (
              <>
                <div className="md:hidden"> {/* Horizontal Scroll for Mobile */}
                   <ScrollArea className="w-full">
                      <div className="flex space-x-4 pb-4">
                        {featuredArticles.map((post) => (
                          <div key={post.id} className="w-72 flex-shrink-0">
                             <BeritaPostCard {...post} />
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>

                <div className="hidden md:grid md:grid-cols-3 gap-6"> {/* Grid for Desktop */}
                  {featuredArticles.map((post) => (
                    <BeritaPostCard key={post.id} {...post} />
                  ))}
                </div>
              </>
            ) : (
               <p className="text-center text-muted-foreground">Belum ada berita unggulan yang dipublikasikan.</p>
            )}

            <div className="mt-12 text-center">
              <Button asChild>
                <Link href="/berita">
                  Lihat Semua Berita <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section id="partnership" className="w-full bg-background py-16 md:py-28 overflow-hidden">
          <div className="container">
            <div className="mb-14 text-center animate-in fade-in zoom-in-95 duration-500">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Jadilah Bagian dari Dampak</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Setiap kontribusi, sekecil apapun, membawa kita selangkah lebih dekat menuju Indonesia yang lebih hijau dan sejahtera.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
                <Card className="p-6 flex flex-col">
                  <HandHeart size={32} className="text-primary mb-4" />
                  <h3 className="font-headline text-xl mb-2">Dukung Sebagai Donatur</h3>
                  <p className="text-muted-foreground text-sm flex-grow">Donasi Anda akan langsung mendanai program-program kami di lapangan, dari penanaman pohon hingga pelatihan petani muda. Jadilah pahlawan bagi bumi.</p>
                  <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href={WHATSAPP_LINK} target="_blank">Beri Donasi</Link>
                  </Button>
                </Card>
                 <Card className="p-6 flex flex-col bg-primary text-primary-foreground border-none">
                  <Target size={32} className="mb-4" />
                  <h3 className="font-headline text-xl mb-2">Gabung Sebagai Anggota</h3>
                  <p className="text-sm opacity-90 flex-grow">Jadilah agen perubahan. Dapatkan akses ke jaringan, pelatihan, dan kesempatan untuk terlibat langsung dalam proyek-proyek yang bermakna.</p>
                  <Button variant="secondary" className="mt-6 w-full" asChild>
                    <Link href="/register">Daftar Sekarang</Link>
                  </Button>
                </Card>
                <Card className="p-6 flex flex-col">
                  <Handshake size={32} className="text-primary mb-4" />
                  <h3 className="font-headline text-xl mb-2">Jalin Kemitraan</h3>
                  <p className="text-muted-foreground text-sm flex-grow">Kami membuka pintu kolaborasi bagi perusahaan, pemerintah, dan NGO. Mari kita bersinergi untuk menciptakan dampak yang lebih besar dan berkelanjutan.</p>
                  <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href={WHATSAPP_LINK} target="_blank">Hubungi Kami</Link>
                  </Button>
                </Card>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
