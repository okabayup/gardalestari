
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  Globe, 
  Leaf, 
  Heart, 
  Recycle, 
  Zap, 
  Cloud, 
  Droplets, 
  PawPrint, 
  TreeDeciduous, 
  Wind, 
  Sprout, 
  Users, 
  Target, 
  CheckCircle,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getBeritaPosts } from './actions/berita';
import { cn } from '@/lib/utils';
import images from './lib/placeholder-images.json';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import LeadGallerySlider from '@/components/landing/LeadGallerySlider';
import fs from 'fs';
import path from 'path';

export default async function LandingPage() {
  const allPosts = await getBeritaPosts('artikel', false);
  const spotlightPosts = allPosts.slice(0, 4);

  // Dynamic Gallery Logic
  const galeriDir = path.join(process.cwd(), 'public/galeri');
  let galeriImages: { url: string; description: string }[] = [];
  
  try {
    if (fs.existsSync(galeriDir)) {
      const files = fs.readdirSync(galeriDir);
      galeriImages = files
        .filter(file => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file))
        .map(file => ({
          url: `/galeri/${file}`,
          description: file.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
        }));
    }
  } catch (error) {
    console.error("Error reading galeri folder:", error);
  }

  // Fallback if folder is empty or doesn't exist
  if (galeriImages.length === 0) {
    galeriImages = [
      { url: images.overlap_1.url, description: 'Nature Conservation' },
      { url: images.overlap_2.url, description: 'Marine Life Protection' },
      { url: images.lead_side.url, description: 'Youth Empowerment' },
    ];
  }

  const initiatives = [
    { title: 'Kampung Aren', desc: 'Inovasi pengolahan aren desa untuk ekonomi lokal.', img: '/program/Kampung Aren.jpg', category: 'Community' },
    { title: 'Sedekahpohon.org', desc: 'Gerakan digital penanaman pohon untuk reboisasi massal.', img: '/program/Sedekah Pohon.jpg', category: 'Reforestation' },
    { title: 'Vanili Lestari', desc: 'Pertanian vanili berkelanjutan dengan standar kualitas global.', img: '/program/Vanili Lestari.jpg', category: 'Agriculture' },
    { title: 'Enviproof', desc: 'Sistem verifikasi data lingkungan berbasis bukti nyata.', img: '/program/Enviproof.jpg', category: 'Technology' },
  ];

  const partners = [
    { name: 'AWS Startup', url: 'https://preditrix.ai/wp-content/uploads/2025/04/aws-n.png' },
    { name: 'Google For Startup', url: 'https://recogify.com/images/googleforstartups.png' },
    { name: 'Nvidia Inception', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1Ij2VDZaMa9SRQyjHm280m-Taa3zcx5jIQg&s' },
    { name: 'BPDLH', url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjZuiY_nP0wEpfqCICn1DBEdqcacjVwW6eURkrUfy8fuwzEihDVw8fl8OGjTo99lsEzJN7wX5F8DS1KWFY0WLMQTatG8wZSa9QLEsucF3KUI8UAoSCQYEDB3BwM-eD_gfNe6VO1-iHN0vFw6jqfSO_vUuIlv07FGf8B2IuyJEtia0cwIlaEEzV8abNHCA/s2127/Logo%20Badan%20Pengelola%20Dana%20Lingkungan%20Hidup%20(BPDLH).png' },
    { name: 'Konservasi Indonesia', url: 'https://sourceup-api-cdn-endpoint-prod.azureedge.net/media/YKI+LOGO-20240902130143971.png' },
    { name: 'BRIN', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Main_Logo_of_National_Research_and_Innovation_Agency_of_Indonesia.svg/500px-Main_Logo_of_National_Research_and_Innovation_Agency_of_Indonesia.svg.png' },
    { name: 'Kemenhut', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Logo_Kementerian_Kehutanan.svg/1280px-Logo_Kementerian_Kehutanan.svg.png' },
    { name: 'JALA', url: 'https://strapi.jala.tech/uploads/jala_logo_6298181eb0.png' },
    { name: 'KKP', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Emblem_of_Indonesia_and_Logo_of_the_Ministry_of_Maritime_Affairs_and_Fisheries_of_the_Republic_of_Indonesia_%28Indonesian_version_2021%29.svg' },
    { name: 'Perhutani', url: 'https://www.perhutani.co.id/wp-content/uploads/2020/02/PHT-new-color-1-1024x737.png' },
    { name: 'PLN', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Logo_PLN.png/960px-Logo_PLN.png' },
    { name: 'Kalibrr', url: 'https://rec-data.kalibrr.com/www.kalibrr.com/logos/KBM8JQKYV99H9FUHDMM32UE3X2F3QVETLNLW852C-5fbe2353.png' },
    { name: 'Astra International', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Logo_of_PT_Astra_International_Tbk_terbaru_2025.png' },
    { name: 'Tempo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Tempo_Magazine.svg/3840px-Tempo_Magazine.svg.png' },
    { name: 'Kompas', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Logo_Kompasdotcom.png' },
    { name: 'Adore Spices', url: 'https://adorespices.com/wp-content/uploads/2023/06/Adore-logo.png' },
    { name: 'TechSoup', url: 'https://data.opendevelopmentcambodia.net/uploads/group/2020-02-25-051508.476440TechSoupAsia-PacificLogo.png' },
    { name: 'Google Nonprofits', url: 'https://lh3.googleusercontent.com/OeG4W5OPZB6S1m9LBzWHY5RcfidqPTRcQNffWJfGVxvZyo97Ia6MpCxi1PPxZDWhAbB2VfysWP_amEy3jYeTFeld5JSrEuV0jfzRdA=w600-h314-rj' },
    { name: 'Microsoft Nonprofits', url: 'https://www.vissensa.com/wp-content/uploads/2025/05/Microsoft-Nonprofits.jpg' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section 
          className={cn(
            "relative min-h-[60vh] md:min-h-[75vh] flex flex-col justify-center overflow-hidden pt-12 md:pt-20 bg-white",
            "bg-no-repeat bg-[size:100%] md:bg-[size:70%] bg-top md:bg-right-top"
          )}
          style={{ backgroundImage: "url('/hero.png')" }}
        >
          <div className="absolute inset-0 bg-white/40 md:hidden pointer-events-none" />

          <div className="container px-6 relative z-10">
            <div className="max-w-2xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-accent leading-[1] md:leading-[0.9] tracking-tighter">
                Small Actions,<br />
                <span className="text-primary">Big Impact</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-accent/90 max-w-[75%] md:max-w-[50%] leading-relaxed font-bold sm:font-medium">
                Setiap langkah kecil yang Anda ambil hari ini menciptakan efek riak, mendorong perubahan demi masa depan alam Indonesia yang lebih baik.
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4 pt-2 md:pt-4">
                <Link href="/register">
                  <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-8 md:px-10 h-12 md:h-14 text-base md:text-lg font-bold shadow-xl shadow-primary/20">
                    Our approach
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="rounded-full border-accent/20 text-accent hover:bg-accent hover:text-white px-8 md:px-10 h-12 md:h-14 text-base md:text-lg font-bold backdrop-blur-md">
                    Join Movement
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="container px-6 mt-12 md:mt-16 pb-8 relative z-10 hidden sm:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { title: 'Coastal Care', desc: 'Melindungi garis pantai dan ekosistem maritim.', img: images.highlight_1.url, hint: images.highlight_1.hint },
                { title: 'Green Living', desc: 'Implementasi gaya hidup berkelanjutan.', img: images.highlight_2.url, hint: images.highlight_2.hint },
                { title: 'Climate Action', desc: 'Inisiatif mitigasi dampak perubahan iklim.', img: images.highlight_3.url, hint: images.highlight_3.hint }
              ].map((card, i) => (
                <Card key={i} className={cn(
                  "organic-card overflow-hidden hover:scale-105 transition-all duration-500 border-none shadow-2xl",
                  i === 2 && "sm:col-span-2 md:col-span-1"
                )}>
                  <CardContent className="p-0 flex flex-col items-center text-center">
                    <div className="relative w-full aspect-video">
                      <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover" />
                    </div>
                    <div className="p-6 md:p-8 space-y-2 bg-white/90 backdrop-blur-sm w-full">
                      <h3 className="font-black text-lg md:text-xl text-accent">{card.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS SECTION */}
        <section className="py-8 md:py-12 bg-muted/30 border-y">
          <div className="container px-6">
            <p className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 md:mb-8">Didukung oleh Institusi & Teknologi Terdepan</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              {partners.map((partner, i) => (
                <div key={i} className="relative h-8 w-20 md:h-12 md:w-32">
                  <Image src={partner.url} alt={partner.name} fill className="object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADING WAY SECTION */}
        <section className="py-16 md:py-24 overflow-hidden">
          <div className="container px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="space-y-6 md:space-y-8 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">
                  <Sparkles size={14} /> Leading the innovation
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black leading-[1.1] md:leading-[0.9] tracking-tighter">Memandu Arah<br /><span className="text-primary">Perubahan Ekologis</span></h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Kami adalah wadah bagi inovator muda yang berkomitmen melindungi planet ini melalui teknologi cerdas di sektor agro-maritim dan kehutanan.
                </p>
                <div className="space-y-4 text-left">
                  {[
                    { title: 'Inovasi Digital', desc: 'Memanfaatkan data dan AI untuk solusi lingkungan.' },
                    { title: 'Pemberdayaan Pemuda', desc: 'Melatih pemimpin masa depan untuk aksi nyata.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-3xl border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><CheckCircle size={20} /></div>
                      <div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white px-8 h-12 font-bold group">
                  Pelajari lebih lanjut <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
              <div className="relative px-6 md:px-0 mt-8 md:mt-0">
                <LeadGallerySlider 
                  images={galeriImages} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* INITIATIVES SLIDER */}
        <section className="py-16 md:py-24 bg-[#1B3022] text-white rounded-[2.5rem] md:rounded-[4rem] mx-4 md:mx-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-10 hidden md:block">
            <TreeDeciduous size={400} />
          </div>
          
          <div className="container px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 md:mb-16 gap-6 text-center md:text-left">
              <div className="max-w-xl space-y-4">
                <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1">Our Programs</Badge>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">Inisiatif Unggulan untuk<br />Masa Depan Hijau</h2>
              </div>
              <Button variant="link" className="text-primary font-black uppercase tracking-widest p-0 h-auto">Lihat semua <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>

            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {initiatives.map((item, i) => (
                  <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none overflow-hidden group h-full bg-white/5 backdrop-blur-md">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative aspect-[3/4] w-full">
                          <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:left-10 text-white space-y-3 md:space-y-4">
                            <Badge className="bg-primary/20 backdrop-blur-md border-none text-white px-4 py-1">{item.category}</Badge>
                            <h3 className="text-2xl md:text-3xl font-bold">{item.title}</h3>
                            <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white hover:text-black w-full justify-between px-6">
                              Temukan Solusi <ArrowRight size={18} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden lg:block">
                <CarouselPrevious className="absolute -left-12 bg-white/10 border-white/20 text-white hover:bg-primary" />
                <CarouselNext className="absolute -right-12 bg-white/10 border-white/20 text-white hover:bg-primary" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* IMPACT STATISTICS */}
        <section className="py-16 md:py-24">
          <div className="container px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: 'Proyek Selesai', value: '150+', icon: Target },
                { label: 'Pohon Ditanam', value: '50k+', icon: Sprout },
                { label: 'Anggota Aktif', value: '12k+', icon: Users },
                { label: 'Wilayah Dampak', value: '24', icon: Globe }
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-muted/30 hover:bg-primary/5 transition-colors">
                  <div className="mx-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 md:mb-4">
                    <stat.icon size={20} className="md:size-24" />
                  </div>
                  <p className="text-2xl md:text-4xl font-black tracking-tighter">{stat.value}</p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPOTLIGHT STORIES */}
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container px-6 space-y-8 md:space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Sorotan Cerita:<br />Aksi yang Berdampak</h2>
              <Button asChild variant="ghost" className="font-bold">
                <Link href="/berita">Semua Berita <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
              {spotlightPosts.map((post, i) => (
                <Link href={`/berita/${post.slug}`} key={i} className="group relative h-72 md:h-96 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white space-y-2">
                    <h3 className="text-xl md:text-3xl font-bold leading-tight line-clamp-2">{post.title}</h3>
                    <p className="text-[9px] md:text-[10px] opacity-70 font-black uppercase tracking-widest">{new Date(post.date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="absolute top-6 md:top-8 right-6 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-2">
                    <ArrowRight className="text-white -rotate-45" size={20} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* DONATION BANNER */}
        <section className="py-16 md:py-24 bg-nature-pattern">
          <div className="container px-6 text-center space-y-8 md:space-y-12">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Fuel the Mission</h2>
              <p className="text-muted-foreground text-base md:text-xl leading-relaxed">Lindungi apa yang paling berharga bagi kita semua: udara, air, dan lanskap yang menopang kehidupan di Bumi Indonesia.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {['Rp 50k', 'Rp 100k', 'Rp 250k', 'Rp 500k', 'Custom'].map(amount => (
                <Button key={amount} variant="outline" className="rounded-full px-6 md:px-8 h-12 md:h-14 font-black hover:border-primary hover:text-primary transition-all text-base md:text-lg">
                  {amount}
                </Button>
              ))}
            </div>
            <Button size="lg" className="rounded-full bg-accent hover:bg-accent/90 px-12 md:px-16 h-14 md:h-16 text-lg md:text-xl font-black uppercase tracking-widest shadow-2xl">Donasi Sekarang</Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
