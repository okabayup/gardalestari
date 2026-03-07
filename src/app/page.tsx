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

export default async function LandingPage() {
  const allPosts = await getBeritaPosts('artikel', false);
  const spotlightPosts = allPosts.slice(0, 4);

  const initiatives = [
    { title: 'Kampung Aren', desc: 'Inovasi pengolahan aren desa untuk ekonomi lokal.', img: images.prog_aren.url, category: 'Community' },
    { title: 'Sedekahpohon.org', desc: 'Gerakan digital penanaman pohon untuk reboisasi massal.', img: images.prog_pohon.url, category: 'Reforestation' },
    { title: 'Vanili Lestari', desc: 'Pertanian vanili berkelanjutan dengan standar kualitas global.', img: images.prog_vanili.url, category: 'Agriculture' },
    { title: 'Enviproof', desc: 'Sistem verifikasi data lingkungan berbasis bukti nyata.', img: "https://picsum.photos/seed/enviproof/600/800", category: 'Technology' },
  ];

  const partners = [
    { name: 'AWS Startup', url: 'https://preditrix.ai/wp-content/uploads/2025/04/aws-n.png' },
    { name: 'Google For Startup', url: 'https://recogify.com/images/googleforstartups.png' },
    { name: 'Nvidia Inception', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1Ij2VDZaMa9SRQyjHm280m-Taa3zcx5jIQg&s' },
    { name: 'BPDLH', url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjZuiY_nP0wEpfqCICn1DBEdqcacjVwW6eURkrUfy8fuwzEihDVw8fl8OGjTo99lsEzJN7wX5F8DS1KWFY0WLMQTatG8wZSa9QLEsucF3KUI8UAoSCQYEDB3BwM-eD_gfNe6VO1-iHN0vFw6jqfSO_vUuIlv07FGf8B2IuyJEtia0cwIlaEEzV8abNHCA/s2127/Logo%20Badan%20Pengelola%20Dana%20Lingkungan%20Hidup%20(BPDLH).png' },
    { name: 'BRIN', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Main_Logo_of_National_Research_and_Innovation_Agency_of_Indonesia.svg/500px-Main_Logo_of_National_Research_and_Innovation_Agency_of_Indonesia.svg.png' },
    { name: 'Kemenhut', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Logo_Kementerian_Kehutanan.svg/1280px-Logo_Kementerian_Kehutanan.svg.png' },
    { name: 'JALA', url: 'https://strapi.jala.tech/uploads/jala_logo_6298181eb0.png' },
    { name: 'KKP', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Emblem_of_Indonesia_and_Logo_of_the_Ministry_of_Maritime_Affairs_and_Fisheries_of_the_Republic_of_Indonesia_%28Indonesian_version_2021%29.svg' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION - Resized background at right-top with white space */}
        <section 
          className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center overflow-hidden pt-20 bg-no-repeat bg-[size:70%] bg-right-top bg-white"
          style={{ backgroundImage: "url('/hero.png')" }}
        >
          <div className="container px-6 relative z-10">
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
              <h1 className="text-6xl md:text-8xl font-black text-accent leading-[0.9] tracking-tighter">
                Small Actions,<br />
                <span className="text-primary">Big Impact</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
                Setiap langkah kecil yang Anda ambil hari ini menciptakan efek riak, mendorong perubahan demi masa depan alam Indonesia yang lebih baik.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                  Our approach
                </Button>
                <Button size="lg" variant="outline" className="rounded-full border-accent/20 text-accent hover:bg-accent hover:text-white px-10 h-14 text-lg font-bold backdrop-blur-md">
                  Join Movement
                </Button>
              </div>
            </div>
          </div>

          {/* HIGHLIGHT CARDS - Floating at bottom of hero */}
          <div className="container px-6 mt-20 pb-12 relative z-10 hidden md:block">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Coastal Care', desc: 'Melindungi garis pantai dan ekosistem maritim nusantara.', img: images.highlight_1.url, hint: images.highlight_1.hint },
                { title: 'Green Living', desc: 'Edukasi dan implementasi gaya hidup berkelanjutan sehari-hari.', img: images.highlight_2.url, hint: images.highlight_2.hint },
                { title: 'Climate Action', desc: 'Inisiatif nyata dalam memitigasi dampak perubahan iklim global.', img: images.highlight_3.url, hint: images.highlight_3.hint }
              ].map((card, i) => (
                <Card key={i} className="organic-card overflow-hidden hover:scale-105 transition-all duration-500 border-none shadow-2xl">
                  <CardContent className="p-0 flex flex-col items-center text-center">
                    <div className="relative w-full aspect-video">
                      <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover" />
                    </div>
                    <div className="p-8 space-y-2 bg-white/90 backdrop-blur-sm w-full">
                      <h3 className="font-black text-xl text-accent">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS SECTION */}
        <section className="py-12 bg-muted/30 border-y">
          <div className="container px-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-8">Didukung oleh Institusi & Teknologi Terdepan</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              {partners.map((partner, i) => (
                <div key={i} className="relative h-10 w-24 md:h-12 md:w-32">
                  <Image src={partner.url} alt={partner.name} fill className="object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADING WAY SECTION */}
        <section className="py-24 overflow-hidden">
          <div className="container px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                  <Sparkles size={14} /> Leading the innovation
                </div>
                <h2 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter">Memandu Arah<br /><span className="text-primary">Perubahan Ekologis</span></h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kami adalah wadah bagi inovator muda yang berkomitmen melindungi planet ini melalui teknologi cerdas di sektor agro-maritim dan kehutanan.
                </p>
                <div className="space-y-4">
                  {[
                    { title: 'Inovasi Digital', desc: 'Memanfaatkan data dan AI untuk solusi lingkungan.' },
                    { title: 'Pemberdayaan Pemuda', desc: 'Melatih pemimpin masa depan untuk aksi nyata.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-3xl border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Check size={20} /></div>
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
              <div className="relative">
                <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl z-10 rotate-3 border-8 border-white">
                  <Image src={images.lead_side.url} alt="Nature" data-ai-hint={images.lead_side.hint} fill className="object-cover" />
                </div>
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-2/3 aspect-square rounded-[3rem] overflow-hidden shadow-xl -z-10 border-8 border-white -rotate-6">
                  <Image src={images.lead_float.url} alt="Eco" data-ai-hint={images.lead_float.hint} fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INITIATIVES SLIDER */}
        <section className="py-24 bg-[#1B3022] text-white rounded-[4rem] mx-4 md:mx-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-10">
            <TreeDeciduous size={400} />
          </div>
          
          <div className="container px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl space-y-4 text-left">
                <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1">Our Programs</Badge>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Inisiatif Unggulan untuk<br />Masa Depan Hijau</h2>
              </div>
              <Button variant="link" className="text-primary font-black uppercase tracking-widest p-0 h-auto">Lihat semua program <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>

            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {initiatives.map((item, i) => (
                  <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="rounded-[2.5rem] border-none overflow-hidden group h-full bg-white/5 backdrop-blur-md">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative aspect-[3/4] w-full">
                          <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute bottom-10 left-10 right-10 text-white space-y-4">
                            <Badge className="bg-primary/20 backdrop-blur-md border-none text-white px-4 py-1">{item.category}</Badge>
                            <h3 className="text-3xl font-bold">{item.title}</h3>
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
              <div className="hidden md:block">
                <CarouselPrevious className="absolute -left-12 bg-white/10 border-white/20 text-white hover:bg-primary" />
                <CarouselNext className="absolute -right-12 bg-white/10 border-white/20 text-white hover:bg-primary" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* IMPACT STATISTICS */}
        <section className="py-24">
          <div className="container px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Proyek Selesai', value: '150+', icon: Target },
                { label: 'Pohon Ditanam', value: '50k+', icon: Sprout },
                { label: 'Anggota Aktif', value: '12k+', icon: Users },
                { label: 'Wilayah Dampak', value: '24', icon: Globe }
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2 p-8 rounded-[2rem] bg-muted/30 hover:bg-primary/5 transition-colors">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <stat.icon size={24} />
                  </div>
                  <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REBUILDING SECTION */}
        <section className="py-24">
          <div className="container px-6 space-y-20">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Membangun Kembali Ekosistem, Memulihkan Keseimbangan</h2>
              <p className="text-muted-foreground text-lg">Kami fokus pada upaya memulihkan keharmonisan antara inovasi pemuda dan pelestarian alam demi generasi mendatang.</p>
            </div>
            
            <div className="grid md:grid-cols-2 items-center gap-0">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl z-0 border-8 border-white">
                <Image src={images.overlap_1.url} alt="Eco" data-ai-hint={images.overlap_1.hint} fill className="object-cover" />
              </div>
              <div className="bg-[#F4F9F1] p-12 md:p-20 rounded-[3rem] -ml-12 relative z-10 space-y-6 shadow-xl border-l-8 border-white">
                <h3 className="text-4xl font-black tracking-tighter text-accent">Capai Lebih Banyak,<br />Bersama-sama</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Platform kami memudahkan siapa saja untuk bergabung dalam misi pemulihan alam dan pengembangan ekonomi yang inklusif melalui rujukan dan poin.</p>
                <Button variant="link" className="text-primary font-black uppercase tracking-widest p-0 h-auto">Lihat detail <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </section>

        {/* SPOTLIGHT STORIES */}
        <section className="py-24 bg-muted/20">
          <div className="container px-6 space-y-12">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-black tracking-tighter">Sorotan Cerita:<br />Aksi yang Berdampak</h2>
              <Button asChild variant="ghost" className="font-bold">
                <Link href="/berita">Semua Berita <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {spotlightPosts.map((post, i) => (
                <Link href={`/berita/${post.slug}`} key={i} className="group relative h-96 rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-10 text-white space-y-2">
                    <h3 className="text-3xl font-bold leading-tight line-clamp-2">{post.title}</h3>
                    <p className="text-[10px] opacity-70 font-black uppercase tracking-widest">{new Date(post.date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-2">
                    <ArrowRight className="text-white -rotate-45" size={24} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* DONATION BANNER */}
        <section className="py-24 bg-nature-pattern">
          <div className="container px-6 text-center space-y-12">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-5xl font-black tracking-tighter">Fuel the Mission</h2>
              <p className="text-muted-foreground text-xl leading-relaxed">Lindungi apa yang paling berharga bagi kita semua: udara, air, dan lanskap yang menopang kehidupan di Bumi Indonesia.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {['Rp 50k', 'Rp 100k', 'Rp 250k', 'Rp 500k', 'Custom'].map(amount => (
                <Button key={amount} variant="outline" className="rounded-full px-8 h-14 font-black hover:border-primary hover:text-primary transition-all text-lg">
                  {amount}
                </Button>
              ))}
            </div>
            <Button size="lg" className="rounded-full bg-accent hover:bg-accent/90 px-16 h-16 text-xl font-black uppercase tracking-widest shadow-2xl">Donasi Sekarang</Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
