
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Globe, Leaf, Heart, Recycle, Zap, Cloud, Droplets, PawPrint, TreeDeciduous, Wind } from 'lucide-react';
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
        <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10">
            <Image 
              src={images.hero_bg.url} 
              alt="Hero Background" 
              data-ai-hint={images.hero_bg.hint}
              fill 
              className="object-cover" 
              priority
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          
          <div className="container relative z-10 px-6">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-6xl md:text-8xl font-black text-white leading-tight">
                Small Actions,<br />Big Impact
              </h1>
              <p className="text-xl text-white/90 max-w-lg">
                Setiap langkah kecil yang Anda ambil hari ini menciptakan riak perubahan demi masa depan alam yang lebih lestari.
              </p>
              <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 h-14 text-lg font-bold">
                Our Approach
              </Button>
            </div>
          </div>

          {/* FLOATING CARDS */}
          <div className="container px-6 mt-20 md:mt-32 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Coastal Care', desc: 'Safeguarding our blue planet', img: images.hero_floating_1.url, hint: images.hero_floating_1.hint },
                { title: 'Green Living', desc: 'Learn how to live sustainably', img: images.hero_floating_2.url, hint: images.hero_floating_2.hint },
                { title: 'Climate Action', desc: 'Take steps to fight climate change', img: images.hero_floating_3.url, hint: images.hero_floating_3.hint }
              ].map((card, i) => (
                <Card key={i} className="glass-pill border-none overflow-hidden hover:scale-105 transition-transform duration-500 rounded-[2rem]">
                  <CardContent className="p-0 flex items-center p-4 gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS SECTION */}
        <section className="py-12 bg-muted/30 overflow-hidden border-y">
          <div className="container px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">Trusted by our partners</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
              {partners.map((p, i) => (
                <div key={i} className="relative h-10 w-24 md:h-12 md:w-32 grayscale hover:grayscale-0 transition-all duration-300">
                  <Image src={p.logo} alt={p.name} fill className="object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADING THE WAY SECTION */}
        <section className="py-24">
          <div className="container px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative flex gap-4">
                <div className="w-1/2 aspect-square relative rounded-[3rem] overflow-hidden rotate-[-5deg] shadow-2xl">
                  <Image src={images.leading_1.url} alt="Nature 1" data-ai-hint={images.leading_1.hint} fill className="object-cover" />
                </div>
                <div className="w-1/2 aspect-square relative rounded-[3rem] overflow-hidden translate-y-12 rotate-[5deg] shadow-2xl">
                  <Image src={images.leading_2.url} alt="Nature 2" data-ai-hint={images.leading_2.hint} fill className="object-cover" />
                </div>
              </div>
              <div className="space-y-6 md:pl-12">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Leading the Way for<br />Ecological Change
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kami adalah komunitas lingkungan yang berkomitmen untuk melindungi planet kita melalui praktik hidup berkelanjutan dan aksi nyata di lapangan.
                </p>
                <Button variant="outline" className="rounded-full px-8 h-12">Learn More</Button>
              </div>
            </div>
          </div>
        </section>

        {/* IMPACT GRID SECTION */}
        <section className="py-24 bg-nature-pattern">
          <div className="container px-6 text-center max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Making an Impact,<br />One Feature at a Time</h2>
              <p className="text-muted-foreground text-lg">Memberdayakan individu dan komunitas untuk menciptakan dunia yang berkelanjutan bagi generasi mendatang.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {[
                { label: 'Climate', img: images.impact_climate.url, icon: Cloud },
                { label: 'Ocean', img: images.impact_ocean.url, icon: Droplets },
                { label: 'Wildlife', img: images.impact_wildlife.url, icon: PawPrint },
                { label: 'Forest', img: images.impact_forest.url, icon: TreeDeciduous },
                { label: 'Energy', img: images.impact_energy.url, icon: Zap },
                { label: 'Waste', img: images.impact_waste.url, icon: Recycle }
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-square rounded-[3rem] overflow-hidden mb-4 shadow-xl border-4 border-transparent group-hover:border-primary transition-all duration-500">
                    <Image src={item.img} alt={item.label} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  </div>
                  <h4 className="font-bold text-xl">{item.label}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REBUILDING ECOSYSTEMS SECTION */}
        <section className="py-24 overflow-hidden">
          <div className="container px-6 space-y-24">
            {/* Row 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-[4rem] overflow-hidden shadow-2xl z-10">
                  <Image src={images.rebuild_1.url} alt="Ecosystem" data-ai-hint={images.rebuild_1.hint} fill className="object-cover" />
                </div>
                <div className="absolute -bottom-12 -right-12 w-2/3 h-full bg-primary/10 rounded-[4rem] -z-10" />
              </div>
              <div className="md:pl-12 space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Rebuilding Ecosystems,<br />Restoring Balance</h2>
                <p className="text-muted-foreground text-lg">Fokus kami adalah memulihkan keharmonisan antara industri dan alam, memastikan masa depan yang berkelanjutan bagi semua makhluk hidup.</p>
                <div className="bg-secondary/20 p-8 rounded-[2rem] space-y-4">
                  <h3 className="text-2xl font-bold">Achieve More, Together</h3>
                  <p className="text-sm">Bergabunglah dengan misi kami hari ini untuk menjaga bumi kita bagi generasi mendatang.</p>
                  <Button variant="default" className="rounded-full w-full justify-between group">
                    Join Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center direction-reverse">
              <div className="space-y-6 order-2 md:order-1">
                <div className="bg-primary text-white p-12 rounded-[3rem] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-20"><Wind size={80} /></div>
                  <h3 className="text-3xl md:text-4xl font-black uppercase">One Vision,<br />Many Hands</h3>
                  <p className="text-white/80 leading-relaxed text-lg">Kerja kami didedikasikan untuk melindungi dan memulihkan lingkungan melalui kolaborasi tanpa batas.</p>
                  <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white hover:text-black">View More</Button>
                </div>
              </div>
              <div className="relative order-1 md:order-2">
                <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl">
                  <Image src={images.rebuild_2.url} alt="Collaborate" data-ai-hint={images.rebuild_2.hint} fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FLAGSHIP PROGRAMS (INITIATIVES) */}
        <section className="py-24 bg-accent text-white rounded-t-[5rem]">
          <div className="container px-6 space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Current Initiatives for a Better Planet</h2>
              <p className="text-white/70 text-lg font-medium italic">Program Unggulan Garda Lestari</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Kampung Aren', desc: 'Inovasi pengolahan aren berkelanjutan.', img: images.prog_aren.url },
                { title: 'Sedekahpohon.org', desc: 'Gerakan digital penanaman satu juta pohon.', img: images.prog_pohon.url },
                { title: 'Vanili Lestari', desc: 'Pemberdayaan petani vanili organik.', img: images.prog_vanili.url },
                { title: 'Seeshark', desc: 'Sistem monitoring hiu berbasis teknologi.', img: images.prog_shark.url }
              ].map((prog, i) => (
                <div key={i} className="group relative bg-white/5 rounded-[3rem] overflow-hidden border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="relative h-48 w-full">
                    <Image src={prog.img} alt={prog.title} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div className="p-8 space-y-4">
                    <h3 className="text-2xl font-bold">{prog.title}</h3>
                    <p className="text-white/60 text-sm">{prog.desc}</p>
                    <Button variant="ghost" className="text-primary hover:text-white p-0 flex items-center gap-2 font-bold group">
                      Learn More <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STORIES SECTION (SPOTLIGHT) */}
        <section className="py-24 bg-muted/20">
          <div className="container px-6 space-y-12">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-bold">In the Spotlight:<br />Stories That Matter</h2>
              <Button variant="link" className="text-primary font-bold">View all news</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {spotlightPosts.map((post, i) => (
                <Link href={`/berita/${post.slug}`} key={i} className="group relative h-80 rounded-[3rem] overflow-hidden shadow-2xl">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2">
                    <p className="text-primary font-bold text-xs uppercase tracking-widest">{post.category}</p>
                    <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">{post.title}</h3>
                    <p className="text-white/60 text-xs">{new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-white -rotate-45" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FUEL THE MISSION SECTION */}
        <section className="py-24">
          <div className="container px-6 text-center max-w-3xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black">Fuel the Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Lindungi apa yang paling penting: udara, air, dan bentang alam<br />yang mendukung kehidupan di Bumi.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {['$5', '$10', '$15', '$20', 'Custom'].map((amt) => (
                <Button key={amt} variant="outline" className="h-16 w-32 rounded-2xl text-xl font-bold border-muted-foreground/20 hover:border-primary hover:bg-primary/5 transition-all">
                  {amt}
                </Button>
              ))}
            </div>
            <Button size="lg" className="rounded-full bg-accent hover:bg-accent/90 px-12 h-16 text-xl font-black uppercase tracking-widest">
              Donate
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
