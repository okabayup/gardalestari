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

export default async function LandingPage() {
  const allPosts = await getBeritaPosts('artikel', false);
  const spotlightPosts = allPosts.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10">
            <Image 
              src={images.hero_bg.url} 
              alt="Hero Background" 
              fill 
              className="object-cover" 
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          
          <div className="container px-6">
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <h1 className="text-6xl md:text-8xl font-black text-accent leading-[0.9] tracking-tighter">
                Small Actions,<br />
                <span className="text-primary">Big Impact</span>
              </h1>
              <p className="text-xl text-accent/80 max-w-xl leading-relaxed font-medium">
                Setiap langkah kecil yang Anda ambil hari ini menciptakan efek riak, mendorong perubahan demi masa depan alam Indonesia yang lebih baik.
              </p>
              <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                Our approach
              </Button>
            </div>
          </div>

          {/* HIGHLIGHT CARDS */}
          <div className="container px-6 mt-20 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Coastal Care', desc: 'Melindungi garis pantai kita.', img: images.highlight_1.url, hint: images.highlight_1.hint },
                { title: 'Green Living', desc: 'Belajar hidup berkelanjutan.', img: images.highlight_2.url, hint: images.highlight_2.hint },
                { title: 'Climate Action', desc: 'Langkah nyata melawan perubahan iklim.', img: images.highlight_3.url, hint: images.highlight_3.hint }
              ].map((card, i) => (
                <Card key={i} className="organic-card overflow-hidden hover:scale-105 transition-all duration-500">
                  <CardContent className="p-0 flex flex-col items-center text-center">
                    <div className="relative w-full aspect-square">
                      <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover" />
                    </div>
                    <div className="p-8 space-y-2">
                      <h3 className="font-black text-xl">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* LEADING WAY SECTION */}
        <section className="py-24 overflow-hidden">
          <div className="container px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter">Leading the Way for<br /><span className="text-primary">Ecological Change</span></h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kami adalah komunitas pemuda yang berkomitmen untuk melindungi planet kita dan mempromosikan gaya hidup berkelanjutan melalui inovasi agro-maritim.
                </p>
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white px-8 h-12 font-bold">
                  Learn more
                </Button>
              </div>
              <div className="relative">
                <div className="relative aspect-square curved-image-right overflow-hidden shadow-2xl z-10">
                  <Image src={images.lead_side.url} alt="Nature" data-ai-hint={images.lead_side.hint} fill className="object-cover" />
                </div>
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-2/3 aspect-square curved-image-left overflow-hidden shadow-xl -z-10 border-8 border-white">
                  <Image src={images.lead_float.url} alt="Eco" data-ai-hint={images.lead_float.hint} fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMPACT GRID */}
        <section className="py-24 bg-muted/30">
          <div className="container px-6 text-center space-y-16">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Making an Impact,<br />One Feature at a Time</h2>
              <p className="text-muted-foreground">Memberdayakan individu dan komunitas untuk menciptakan dunia yang lebih berkelanjutan bersama.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {[
                { label: 'Climate', img: images.impact_climate.url, hint: images.impact_climate.hint },
                { label: 'Ocean', img: images.impact_ocean.url, hint: images.impact_ocean.hint },
                { label: 'Wildlife', img: images.impact_wildlife.url, hint: images.impact_wildlife.hint },
                { label: 'Forest', img: images.impact_forest.url, hint: images.impact_forest.hint },
                { label: 'Energy', img: images.impact_energy.url, hint: images.impact_energy.hint },
                { label: 'Waste', img: images.impact_waste.url, hint: images.impact_waste.hint }
              ].map((item, i) => (
                <div key={i} className="space-y-4 group cursor-pointer">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-lg border-4 border-white group-hover:scale-105 transition-transform duration-500">
                    <Image src={item.img} alt={item.label} data-ai-hint={item.hint} fill className="object-cover" />
                  </div>
                  <p className="font-bold text-lg uppercase tracking-widest text-accent/60 group-hover:text-primary transition-colors">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REBUILDING SECTION */}
        <section className="py-24">
          <div className="container px-6 space-y-20">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Rebuilding Ecosystems,<br />Restoring Balance</h2>
              <p className="text-muted-foreground">Kami fokus pada upaya memulihkan keharmonisan antara industri dan kemanusiaan demi generasi mendatang.</p>
            </div>
            
            {/* Overlapping Cards 1 */}
            <div className="grid md:grid-cols-2 items-center gap-0">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl z-0">
                <Image src={images.overlap_1.url} alt="Eco" data-ai-hint={images.overlap_1.hint} fill className="object-cover" />
              </div>
              <div className="bg-[#F4F9F1] p-12 md:p-20 rounded-[3rem] -ml-12 relative z-10 space-y-6 shadow-xl border-l-8 border-white">
                <h3 className="text-4xl font-black tracking-tighter text-accent">Achieve More,<br />Together</h3>
                <p className="text-muted-foreground">Platform kami memudahkan siapa saja untuk bergabung dalam misi pemulihan alam dan ekonomi yang inklusif.</p>
                <Button variant="link" className="text-primary font-black uppercase tracking-widest p-0 h-auto">View more <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>

            {/* Overlapping Cards 2 */}
            <div className="grid md:grid-cols-2 items-center gap-0 direction-reverse">
              <div className="bg-[#EBF5FF] p-12 md:p-20 rounded-[3rem] -mr-12 relative z-10 space-y-6 shadow-xl border-r-8 border-white">
                <h3 className="text-4xl font-black tracking-tighter text-accent">One Vision,<br />Many Hands</h3>
                <p className="text-muted-foreground">Kerja keras kami didedikasikan untuk memastikan ekosistem laut dan darat tetap terlindungi secara berkelanjutan.</p>
                <Button variant="link" className="text-primary font-black uppercase tracking-widest p-0 h-auto">View more <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl z-0">
                <Image src={images.overlap_2.url} alt="Nature" data-ai-hint={images.overlap_2.hint} fill className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* INITIATIVES SECTION */}
        <section className="py-24 bg-muted/20">
          <div className="container px-6 space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Current Initiatives for a<br /><span className="text-primary">Better Planet</span></h2>
              <p className="text-muted-foreground">Program unggulan kami fokus pada penanganan tantangan lingkungan yang mendesak.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Kampung Aren', desc: 'Inovasi pengolahan aren desa.', img: images.prog_aren.url },
                { title: 'Sedekahpohon.org', desc: 'Gerakan digital penanaman pohon.', img: images.prog_pohon.url },
                { title: 'Vanili Lestari', desc: 'Pertanian vanili berkelanjutan.', img: images.prog_vanili.url }
              ].map((card, i) => (
                <Card key={i} className="organic-card overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4]">
                      <Image src={card.img} alt={card.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                        <h3 className="text-2xl font-bold">{card.title}</h3>
                        <p className="text-sm opacity-80">{card.desc}</p>
                        <Button variant="outline" className="w-full mt-4 rounded-full border-white/30 text-white hover:bg-white hover:text-black">Donate</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SPOTLIGHT STORIES */}
        <section className="py-24">
          <div className="container px-6 space-y-12">
            <h2 className="text-4xl font-black tracking-tighter text-center sm:text-left">In the Spotlight:<br />Stories That Matter</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {spotlightPosts.map((post, i) => (
                <Link href={`/berita/${post.slug}`} key={i} className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-lg">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-2">
                    <h3 className="text-2xl font-bold leading-tight line-clamp-2">{post.title}</h3>
                    <p className="text-xs opacity-70 font-medium uppercase tracking-widest">{new Date(post.date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="absolute top-8 right-8 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-white -rotate-45" size={20} />
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
              <p className="text-muted-foreground">Lindungi apa yang paling berharga bagi kita semua: udara, air, dan lanskap yang menopang kehidupan di Bumi.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {['$5', '$10', '$15', '$20', 'Custom'].map(amount => (
                <Button key={amount} variant="outline" className="rounded-full px-8 h-12 font-bold hover:border-primary hover:text-primary transition-all">
                  {amount}
                </Button>
              ))}
            </div>
            <Button size="lg" className="rounded-full bg-accent hover:bg-accent/90 px-12 h-14 text-lg font-black uppercase tracking-widest shadow-2xl">Donate</Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}