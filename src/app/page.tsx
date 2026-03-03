
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Users, Sprout, Ship, TreePine, Handshake, Target, ArrowRight, Award, Zap, Globe, Recycle, Heart } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getAppSettings } from './actions/settings';
import { getBeritaPosts } from './actions/berita';
import BeritaPostCard from '@/components/berita/BeritaPostCard';

export default async function LandingPage() {
  const settings = await getAppSettings();
  const allPosts = await getBeritaPosts('artikel', false);
  const featuredArticles = allPosts.slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-12 md:pt-32 md:pb-24 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto bg-accent text-white rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-8 shadow-2xl overflow-hidden">
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
                <p className="text-primary font-bold uppercase tracking-widest text-sm">Together</p>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  We can heal the <span className="text-primary italic">Nature</span>
                </h1>
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-8 text-lg font-bold">
                  Discover Now
                </Button>
              </div>
              <div className="relative w-64 h-64 md:w-80 md:h-80 animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <Image 
                  src="https://picsum.photos/seed/nature-tree/600/600" 
                  alt="Tree in globe" 
                  data-ai-hint="tree plant bowl"
                  width={400} 
                  height={400} 
                  className="relative z-10 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* JOIN SECTION */}
        <section className="py-16 md:py-24 bg-nature-pattern">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <p className="text-primary font-bold uppercase text-sm">Creative Work</p>
              <h2 className="text-4xl md:text-5xl font-bold">Let's Join To Build The Better World Together</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Global Warming', img: 'https://picsum.photos/seed/storm/400/600', hint: 'lightning storm' },
                { title: 'The Tree', img: 'https://picsum.photos/seed/green-forest/400/600', hint: 'lush green tree', active: true },
                { title: 'Save Animals', img: 'https://picsum.photos/seed/elephant/400/600', hint: 'elephant nature' }
              ].map((card, i) => (
                <div key={i} className={cn("group relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-xl", card.active && "ring-4 ring-primary ring-offset-4")}>
                  <Image src={card.img} alt={card.title} data-ai-hint={card.hint} fill className="object-cover transition-transform group-hover:scale-110 duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <p className="text-sm opacity-80">Global</p>
                    <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                    <Button variant="outline" className="rounded-full border-white text-white hover:bg-white hover:text-black">Discover More</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-16 md:py-24 overflow-hidden">
          <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <p className="text-primary font-bold uppercase text-sm">What we offer</p>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">Our Work Enables Critical Benefits</h2>
              <div className="space-y-6">
                {[
                  { title: 'Wildlife Protection', icon: Heart, desc: 'Melindungi habitat satwa liar di seluruh nusantara.' },
                  { title: 'Water Conservation', icon: Sprout, desc: 'Pengelolaan sumber daya air yang berkelanjutan.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button size="lg" className="rounded-full px-8">Discover More</Button>
            </div>
            <div className="relative">
              <Image 
                src="https://picsum.photos/seed/hand-tree/800/800" 
                alt="Hand holding tree" 
                data-ai-hint="hand holding small tree"
                width={600} 
                height={600} 
                className="rounded-[3rem] shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="py-24 bg-accent text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
            <h2 className="text-[20rem] font-bold text-white leading-none">NATURE</h2>
          </div>
          <div className="container relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Solutions That Drive Sustain Growth</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '100+', label: 'Years of Experience' },
                { value: '120+', label: 'Complete Project' },
                { value: '10K', label: 'Family Supported' },
                { value: '12K', label: 'Active Projects' }
              ].map((stat, i) => (
                <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-8 text-center rounded-[2rem]">
                  <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-sm opacity-70">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* LATEST BLOGS */}
        <section className="py-24 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-16">
              <p className="text-primary font-bold uppercase text-sm">Learning</p>
              <h2 className="text-4xl font-bold mt-2">Exploring the Nature of Life Blog & Articles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
