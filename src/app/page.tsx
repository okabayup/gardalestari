import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Users, Sprout, Ship, TreePine, Handshake, Target, ArrowRight, Award, Zap, Globe, Recycle, Heart, CheckCircle } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getAppSettings } from './actions/settings';
import { getBeritaPosts } from './actions/berita';
import BeritaPostCard from '@/components/berita/BeritaPostCard';
import { cn } from '@/lib/utils';
import images from './lib/placeholder-images.json';

export default async function LandingPage() {
  const settings = await getAppSettings();
  const allPosts = await getBeritaPosts('artikel', false);
  const featuredArticles = allPosts.slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-5xl mx-auto bg-accent text-white rounded-[3rem] p-8 md:p-20 flex flex-col md:flex-row items-center gap-12 shadow-2xl overflow-hidden">
              <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                <p className="text-primary font-bold uppercase tracking-widest text-sm md:text-base">Bersama Kita Bisa</p>
                <h1 className="text-5xl md:text-8xl font-bold leading-tight">
                  Sembuhkan <span className="text-primary italic">Alam</span> Kita
                </h1>
                <p className="text-lg text-white/70 max-w-md">
                  Garda Lestari adalah wadah bagi pemuda Indonesia untuk berinovasi dan beraksi nyata dalam sektor agro-maritim dan kehutanan.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 text-lg font-bold h-14">
                    Mulai Aksi
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white hover:text-black px-10 text-lg font-bold h-14">
                    Pelajari Visi
                  </Button>
                </div>
              </div>
              <div className="relative w-72 h-72 md:w-[450px] md:h-[450px] animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                <Image 
                  src={images.hero_nature.url} 
                  alt="Nature Concept" 
                  data-ai-hint={images.hero_nature.hint}
                  width={500} 
                  height={500} 
                  className="relative z-10 object-contain drop-shadow-[0_20px_50px_rgba(118,185,0,0.3)]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* IMPACT GRID */}
        <section className="py-20 md:py-32 bg-nature-pattern">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
              <p className="text-primary font-bold uppercase tracking-widest text-sm">Dampak Nyata</p>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">Bergabunglah Membangun Dunia yang Lebih Baik</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { title: 'Global Warming', img: images.impact_warming.url, hint: images.impact_warming.hint, category: 'Iklim' },
                { title: 'Konservasi Pohon', img: images.impact_tree.url, hint: images.impact_tree.hint, category: 'Hutan', active: true },
                { title: 'Selamatkan Satwa', img: images.impact_animals.url, hint: images.impact_animals.hint, category: 'Biodiversitas' }
              ].map((card, i) => (
                <div key={i} className={cn(
                  "group relative rounded-[3rem] overflow-hidden aspect-[3/4.5] shadow-2xl transition-all duration-500 hover:-translate-y-4",
                  card.active && "ring-4 ring-primary ring-offset-8"
                )}>
                  <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover transition-transform group-hover:scale-110 duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10 text-white space-y-4">
                    <Badge className="bg-primary/20 backdrop-blur-md border-none text-white px-4 py-1">{card.category}</Badge>
                    <h3 className="text-3xl font-bold">{card.title}</h3>
                    <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white hover:text-black w-full justify-between px-6">
                      Temukan Solusi <ArrowRight size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-20 md:py-32 overflow-hidden bg-secondary/30">
          <div className="container grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="space-y-4">
                <p className="text-primary font-bold uppercase tracking-widest text-sm">Manfaat Organisasi</p>
                <h2 className="text-4xl md:text-6xl font-bold leading-tight">Kerja Kami Memungkinkan Dampak Kritis</h2>
              </div>
              <div className="grid gap-8">
                {[
                  { title: 'Perlindungan Satwa Liar', icon: Heart, desc: 'Melindungi habitat satwa liar di seluruh nusantara dari ancaman kepunahan.' },
                  { title: 'Konservasi Air', icon: Sprout, desc: 'Pengelolaan sumber daya air yang berkelanjutan untuk masa depan pertanian.' },
                  { title: 'Ekonomi Hijau', icon: Recycle, desc: 'Membangun model bisnis yang ramah lingkungan dan menguntungkan pemuda.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-lg flex items-center justify-center text-primary shrink-0 transition-transform group-hover:rotate-12">
                      <item.icon size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button size="lg" className="rounded-full px-10 h-14 text-lg">Pelajari Lebih Lanjut</Button>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] -rotate-3 -z-10"></div>
              <Image 
                src={images.benefit_hand.url} 
                alt="Human Impact" 
                data-ai-hint={images.benefit_hand.hint}
                width={700} 
                height={700} 
                className="rounded-[4rem] shadow-2xl border-8 border-white"
              />
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="py-32 bg-accent text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none select-none">
            <h2 className="text-[25rem] font-bold text-white leading-none">GML</h2>
          </div>
          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">Solusi yang Mendorong Pertumbuhan Berkelanjutan</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                { value: '100+', label: 'Tahun Pengalaman Kolektif' },
                { value: '120+', label: 'Proyek Selesai' },
                { value: '10K+', label: 'Keluarga Terbantu' },
                { value: '12K+', label: 'Anggota Aktif' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm p-10 text-center rounded-[3rem] hover:bg-white/10 transition-colors">
                  <p className="text-5xl md:text-6xl font-bold text-primary mb-4">{stat.value}</p>
                  <p className="text-sm md:text-base opacity-70 font-medium uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VOLUNTEER SHOWCASE */}
        <section className="py-24 bg-background overflow-hidden">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl space-y-4">
                <p className="text-primary font-bold uppercase text-sm tracking-widest">Relawan Kami</p>
                <h2 className="text-4xl md:text-5xl font-bold">Wajah-Wajah di Balik Perubahan Nyata</h2>
              </div>
              <Button variant="outline" className="rounded-full px-8 h-12">Lihat Semua Relawan</Button>
            </div>
            <div className="flex flex-wrap justify-center gap-12">
              {[
                { name: 'Andi', role: 'Aktivis Hutan', img: images.volunteer_1.url },
                { name: 'Siti', role: 'Inovator Maritim', img: images.volunteer_2.url },
                { name: 'Budi', role: 'Ahli Agro', img: images.volunteer_3.url }
              ].map((v, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6 transition-transform group-hover:scale-105">
                    <Image src={v.img} alt={v.name} fill className="object-cover" />
                  </div>
                  <h4 className="font-bold text-xl">{v.name}</h4>
                  <p className="text-primary text-sm font-semibold">{v.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LATEST BLOGS */}
        <section className="py-24 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-16 space-y-4">
              <p className="text-primary font-bold uppercase text-sm tracking-widest">Warta GML</p>
              <h2 className="text-4xl md:text-5xl font-bold">Eksplorasi Alam Melalui Tulisan</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              {featuredArticles.map((post) => (
                <BeritaPostCard key={post.slug} {...post} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
