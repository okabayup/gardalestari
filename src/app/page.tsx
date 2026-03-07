
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Globe, Leaf, Heart, Recycle, Zap, Cloud, Droplets, PawPrint, TreeDeciduous, Wind, Sprout, Users, Target, CheckCircle } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getBeritaPosts } from './actions/berita';
import { cn } from '@/lib/utils';
import images from './lib/placeholder-images.json';

const partners = [
  { name: 'AWS Startup', logo: 'https://preditrix.ai/wp-content/uploads/2025/04/aws-n.png' },
  { name: 'Google For Startup', logo: 'https://recogify.com/images/googleforstartups.png' },
  { name: 'Nvidia Inception', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1Ij2VDZaMa9SRQyjHm280m-Taa3zcx5jIQg&s' },
  { name: 'BPDLH', logo: 'https://webapi-bpdlh.kemenkeu.go.id/storage/settings/logo/2025/10/23/SCMH26WlMVMfbfEYUEgnnVBxCLQReyA4TANC701I.png' },
  { name: 'Konservasi Indonesia', logo: 'https://sourceup-api-cdn-endpoint-prod.azureedge.net/media/YKI+LOGO-20240902130143971.png' },
  { name: 'BRIN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Main_Logo_of_National_Research_and_Innovation_Agency_of_Indonesia.svg/500px-Main_Logo_of_National_Research_and_Innovation_Agency_of_Indonesia.svg.png' },
  { name: 'Kemenhut', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Logo_Kementerian_Kehutanan.svg/1280px-Logo_Kementerian_Kehutanan.svg.png' },
  { name: 'JALA', logo: 'https://strapi.jala.tech/uploads/jala_logo_6298181eb0.png' },
  { name: 'KKP', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Emblem_of_Indonesia_and_Logo_of_the_Ministry_of_Maritime_Affairs_and_Fisheries_of_the_Republic_of_Indonesia_%28Indonesian_version_2021%29.svg' }
];

export default async function LandingPage() {
  const allPosts = await getBeritaPosts('artikel', false);
  const spotlightPosts = allPosts.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative min-h-[95vh] flex flex-col justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10">
            <Image 
              src={images.hero_bg.url} 
              alt="Hero Background" 
              fill 
              className="object-cover" 
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="container relative z-10 px-6">
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <Badge className="bg-primary/20 backdrop-blur-md border-none text-primary-foreground px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs">
                Inovasi Agro-Maritim & Kehutanan
              </Badge>
              <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                Together We Can<br />
                <span className="text-primary italic">Heal the Nature</span>
              </h1>
              <p className="text-xl text-white/80 max-w-xl leading-relaxed">
                Garda Lestari adalah wadah kolaborasi bagi pemuda inovator untuk memulihkan ekosistem dan membangun kemandirian ekonomi berbasis alam di Indonesia.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                  Pelajari Visi Kami
                </Button>
                <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white hover:text-black px-10 h-14 text-lg font-bold backdrop-blur-sm">
                  Bergabung Sekarang
                </Button>
              </div>
            </div>
          </div>

          {/* FLOATING IMPACT CARDS */}
          <div className="container px-6 mt-20 pb-12 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Pulihkan Pesisir', desc: 'Melindungi garis pantai dan ekosistem laut.', img: images.hero_floating_1.url, hint: images.hero_floating_1.hint },
                { title: 'Hutan Lestari', desc: 'Konservasi aktif dan pemberdayaan masyarakat.', img: images.hero_floating_2.url, hint: images.hero_floating_2.hint },
                { title: 'Ketahanan Pangan', desc: 'Inovasi pertanian cerdas dan berkelanjutan.', img: images.hero_floating_3.url, hint: images.hero_floating_3.hint }
              ].map((card, i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-md border-none overflow-hidden hover:scale-105 transition-all duration-500 rounded-[2.5rem] shadow-xl">
                  <CardContent className="p-5 flex items-center gap-5">
                    <div className="relative w-20 h-20 rounded-3xl overflow-hidden shrink-0 shadow-lg">
                      <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS LOGO STRIP */}
        <section className="py-12 bg-muted/30 overflow-hidden border-y border-border/50">
          <div className="container px-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-8">Strategically Collaborating with Global Leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
              {partners.map((p, i) => (
                <div key={i} className="relative h-8 w-24 md:h-10 md:w-28 transition-transform hover:scale-110">
                  <Image src={p.logo} alt={p.name} fill className="object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS: REBUILDING ECOSYSTEMS */}
        <section className="py-24 overflow-hidden">
          <div className="container px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-[4rem] overflow-hidden shadow-2xl z-10">
                  <Image src={images.rebuild_1.url} alt="Ecosystem" data-ai-hint={images.rebuild_1.hint} fill className="object-cover" />
                </div>
                <div className="absolute -bottom-12 -right-12 w-2/3 h-full bg-primary/10 rounded-[4rem] -z-10 animate-pulse" />
              </div>
              <div className="space-y-8 md:pl-12">
                <Badge variant="outline" className="border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">Benefit Keanggotaan</Badge>
                <h2 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter">Leading the Way for<br /><span className="text-primary">Ecological Change</span></h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kami mengintegrasikan teknologi dan kearifan lokal untuk menciptakan dampak nyata yang terukur bagi alam dan komunitas.
                </p>
                <div className="grid gap-4">
                  {[
                    { title: 'Jaringan Inovator', desc: 'Terhubung dengan ribuan pemuda kreatif se-Indonesia.' },
                    { title: 'Pendampingan Ahli', desc: 'Akses ke mentor di bidang agrikultur dan kehutanan.' },
                    { title: 'Dukungan Pendanaan', desc: 'Fasilitasi modal untuk proyek aksi lingkungan yang potensial.' }
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
              </div>
            </div>
          </div>
        </section>

        {/* NATURE STATISTICS */}
        <section className="py-24 bg-accent text-white rounded-[4rem] mx-4 my-8">
          <div className="container px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Proyek Selesai', value: '150+' },
                { label: 'Anggota Aktif', value: '12K+' },
                { label: 'Pohon Ditanam', value: '1.2M+' },
                { label: 'Mitra Global', value: '45+' }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-5xl md:text-7xl font-black tracking-tighter text-primary">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FLAGSHIP PROGRAMS SECTION */}
        <section className="py-24">
          <div className="container px-6 space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Current Initiatives for a<br />Better Planet</h2>
              <p className="text-muted-foreground">Program unggulan Garda Lestari yang sedang berjalan.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Kampung Aren', desc: 'Inovasi pengolahan aren berkelanjutan untuk ekonomi desa.', img: images.prog_aren.url, category: 'Agrikultur' },
                { title: 'Sedekahpohon.org', desc: 'Gerakan digital penanaman satu juta pohon nusantara.', img: images.prog_pohon.url, category: 'Konservasi' },
                { title: 'Vanili Lestari', desc: 'Pemberdayaan petani vanili organik kualitas ekspor.', img: images.prog_vanili.url, category: 'Pemberdayaan' },
                { title: 'Enviproof', desc: 'Sistem verifikasi data lingkungan transparan berbasis blockchain.', img: images.prog_enviproof.url, category: 'Teknologi' }
              ].map((card, i) => (
                <div key={i} className="group relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl border border-border/50">
                  <Image src={card.img} alt={card.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10 text-white space-y-4">
                    <Badge className="bg-primary/20 backdrop-blur-md border-none text-white px-4 py-1">{card.category}</Badge>
                    <h3 className="text-3xl font-bold leading-tight">{card.title}</h3>
                    <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white hover:text-black w-full justify-between px-6" asChild>
                      <Link href="/programs">
                        Temukan Solusi <ArrowRight size={18} />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DONATION BANNER */}
        <section className="py-24 bg-nature-pattern">
          <div className="container px-6">
            <Card className="bg-primary text-white rounded-[4rem] border-none overflow-hidden relative shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 p-12 opacity-10"><Wind size={200} /></div>
              <CardContent className="p-12 md:p-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl space-y-6">
                  <h2 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter uppercase">One Vision,<br />Many Hands</h2>
                  <p className="text-lg text-white/80 font-medium">Donasi Anda membantu kami memperluas jangkauan program pemulihan ekosistem ke seluruh penjuru nusantara.</p>
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto shrink-0">
                  <Button size="lg" variant="secondary" className="rounded-full h-16 px-12 text-xl font-black uppercase tracking-widest shadow-xl">Kontribusi Sekarang</Button>
                  <p className="text-center text-xs font-bold uppercase tracking-widest opacity-60">Verified by BPDLH & Kemenhut</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SPOTLIGHT STORIES */}
        <section className="py-24">
          <div className="container px-6 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">In the Spotlight:<br />Stories That Matter</h2>
                <p className="text-muted-foreground">Kabar terbaru dari lapangan dan inovasi komunitas.</p>
              </div>
              <Button variant="link" className="text-primary font-bold text-lg p-0 h-auto" asChild>
                <Link href="/berita">Lihat Semua Berita <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {spotlightPosts.map((post, i) => (
                <Link href={`/berita/${post.slug}`} key={i} className="group relative h-96 rounded-[3.5rem] overflow-hidden shadow-2xl">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-10 space-y-3">
                    <p className="text-primary font-black text-xs uppercase tracking-widest">{post.category}</p>
                    <h3 className="text-3xl font-bold text-white leading-tight line-clamp-2">{post.title}</h3>
                    <div className="flex items-center gap-4 text-white/60 text-xs font-medium">
                      <span>{new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span>Oleh {post.author}</span>
                    </div>
                  </div>
                  <div className="absolute top-8 right-8 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                    <ArrowRight className="text-white -rotate-45" size={24} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
