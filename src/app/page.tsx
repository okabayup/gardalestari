
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Sprout, Ship, TreePine, Linkedin, Instagram, Twitter, Facebook } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { Logo } from '@/components/icons/Logo';

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <Card className="text-center transition-transform transform hover:scale-105 hover:shadow-xl">
        <CardHeader>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
        </div>
        <CardTitle className="mt-4 font-headline text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
        <p className="text-muted-foreground">{children}</p>
        </CardContent>
    </Card>
);


export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-36 lg:py-48">
          <div className="container text-center">
            <div className="absolute inset-0 -z-10">
                <Image
                    src="https://picsum.photos/1920/1080?grayscale"
                    alt="Lanskap alam Indonesia"
                    data-ai-hint="indonesia landscape"
                    fill
                    className="object-cover opacity-10"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
              Garda Terdepan Inovasi Pemuda
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
             Untuk Kelestarian Sektor Agro, Maritim, dan Kehutanan Indonesia.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Gabung Sekarang</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#about">Pelajari Lebih Lanjut</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="w-full bg-card py-16 md:py-28">
            <div className="container grid gap-8 md:grid-cols-2 md:items-center">
                <div className="relative h-64 w-full md:h-full rounded-lg overflow-hidden">
                    <Image src="https://picsum.photos/id/1074/800/600" alt="Tim Garda Lestari berdiskusi" data-ai-hint="youth collaboration" fill className="object-cover" />
                </div>
                <div className="space-y-4">
                    <span className="text-sm font-semibold uppercase text-primary">Tentang Kami</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Siapa Garda Lestari?</h2>
                    <p className="text-muted-foreground">Garda Lestari adalah organisasi kepemudaan yang lahir dari keprihatinan dan harapan untuk masa depan Indonesia. Kami berfokus pada pemberdayaan pemuda sebagai agen perubahan dalam mengelola dan menginovasi sektor agro, maritim, dan kehutanan secara berkelanjutan.</p>
                    <p className="text-muted-foreground">Kami percaya bahwa potensi terbesar bangsa ini terletak pada sumber daya alamnya yang melimpah dan semangat pemudanya yang tak terbatas.</p>
                </div>
            </div>
        </section>


        {/* Vision & Mission Section */}
        <section id="vision" className="w-full bg-background py-16 md:py-28">
          <div className="container">
             <div className="mb-14 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Visi & Misi</h2>
            </div>
            <div className="grid gap-12 sm:grid-cols-1 lg:grid-cols-2">
              <div className="space-y-3">
                  <h3 className="font-headline text-2xl font-semibold">Visi Kami</h3>
                  <p className="text-muted-foreground">Menjadi inkubator utama bagi lahirnya pemimpin dan inovator muda yang mampu membawa sektor agro, maritim, dan kehutanan Indonesia ke panggung dunia dengan prinsip keberlanjutan.</p>
              </div>
              <div className="space-y-3">
                  <h3 className="font-headline text-2xl font-semibold">Misi Kami</h3>
                  <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Menciptakan ekosistem kolaboratif bagi pemuda untuk belajar, berinovasi, dan berkarya.</li>
                      <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Mengembangkan program-program yang meningkatkan kompetensi dan daya saing pemuda.</li>
                      <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Mendorong implementasi teknologi dan praktik terbaik untuk kelestarian lingkungan.</li>
                  </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Focus Section */}
        <section id="focus" className="w-full bg-secondary py-16 md:py-28">
          <div className="container">
            <div className="mb-14 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Fokus Utama Kami</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Kami bergerak di tiga sektor utama yang menjadi pilar kekuatan alam Indonesia, dengan pemuda sebagai garda terdepan perubahan.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard icon={<Sprout size={28} />} title="Agro">Mengembangkan inovasi pertanian modern, ketahanan pangan, dan mencetak wirausahawan tani muda yang berdaya saing global.</FeatureCard>
              <FeatureCard icon={<Ship size={28} />} title="Maritim">Memajukan ekonomi biru melalui pengelolaan sumber daya laut yang berkelanjutan, teknologi perkapalan, dan konservasi ekosistem pesisir.</FeatureCard>
              <FeatureCard icon={<TreePine size={28} />} title="Kehutanan">Menjaga kelestarian hutan melalui program reforestasi, perhutanan sosial, dan pencegahan deforestasi berbasis komunitas.</FeatureCard>
            </div>
          </div>
        </section>

         {/* Why Join Us Section */}
        <section id="join" className="w-full bg-background py-16 md:py-28">
          <div className="container">
            <div className="mb-14 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Mengapa Bergabung?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Menjadi bagian dari Garda Lestari bukan sekadar keanggotaan, tetapi sebuah perjalanan untuk bertumbuh dan memberi dampak.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard icon={<Users size={28} />} title="Jaringan Luas">Terhubung dengan sesama pemuda, para ahli, dan pemimpin industri di tiga sektor vital. Bangun relasi yang akan membentuk masa depan Anda.</FeatureCard>
              <FeatureCard icon={<Leaf size={28} />} title="Pengembangan Diri">Akses eksklusif ke berbagai lokakarya, seminar, dan program mentoring yang dirancang untuk mengasah keahlian dan pengetahuan Anda.</FeatureCard>
              <FeatureCard icon={<Sprout size={28} />} title="Kontribusi Nyata">Terlibat langsung dalam proyek-proyek inovatif yang memberikan dampak positif bagi masyarakat dan kelestarian lingkungan Indonesia.</FeatureCard>
            </div>
             <div className="mt-12 text-center">
                <Button size="lg" asChild>
                    <Link href="/register">Daftarkan Diri Anda</Link>
                </Button>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t bg-card">
        <div className="container py-8">
            <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <Logo className="h-6 w-6 text-primary" />
                        <span className="font-headline text-xl">Garda Lestari</span>
                    </Link>
                    <p className="text-sm text-muted-foreground">Organisasi Kepemudaan untuk Inovasi Berkelanjutan.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold">Navigasi</h4>
                    <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <Link href="#about" className="hover:text-primary">Tentang Kami</Link>
                        <Link href="#focus" className="hover:text-primary">Fokus</Link>
                        <Link href="/blog" className="hover:text-primary">Blog</Link>
                    </nav>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold">Hubungi Kami</h4>
                    <p className="text-sm text-muted-foreground">Email: <a href="mailto:kontak@gardalestari.id" className="text-primary hover:underline">kontak@gardalestari.id</a></p>
                    <div className="flex items-center gap-2">
                       <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><Linkedin size={20} /></Link>
                       <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></Link>
                       <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter size={20} /></Link>
                       <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook size={20} /></Link>
                    </div>
                </div>
            </div>
            <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Garda Lestari. Semua hak dilindungi.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
