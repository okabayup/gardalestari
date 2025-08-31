
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Sprout, Ship, TreePine, Instagram } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import { getSocialMediaLinks } from './actions/settings';

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

const Footer = async () => {
    const socialLinks = await getSocialMediaLinks();

    return (
        <footer className="border-t bg-card">
            <div className="container py-8">
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-2">
                        <Link href="/" className="flex items-center gap-2 font-bold">
                            <Image src="/logo.png" alt="Garda Lestari Logo" width={24} height={24} />
                            <span className="font-headline text-xl">Garda Lestari</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">Wadah bagi pemuda Indonesia untuk inovasi di sektor agro-maritim dan kehutanan.</p>
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
                        <div className="text-sm text-muted-foreground">
                           <p>Email: <a href="mailto:halo@gardalestari.org" className="text-primary hover:underline">halo@gardalestari.org</a></p>
                           <p>Telepon: <a href="tel:085937010409" className="text-primary hover:underline">085937010409</a></p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Link href="https://instagram.com/garda.lestari" target="_blank" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></Link>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Garda Muda Lestari. Semua hak dilindungi.</p>
                </div>
            </div>
        </footer>
    );
};


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
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Garda Muda Lestari</h2>
                    <p className="text-muted-foreground">Dengan nama merek "Garda Lestari", kami adalah perkumpulan yang berdedikasi untuk pemberdayaan pemuda Indonesia. Kami berfungsi sebagai wadah bagi para pemuda untuk mengembangkan potensi dan inovasi mereka di bidang agro-maritim dan kehutanan, dengan penekanan kuat pada keberlanjutan dan pembangunan ekonomi.</p>
                    <p className="text-muted-foreground">Melalui serangkaian program yang mencakup pelatihan, pendampingan, dan kolaborasi, kami berkomitmen untuk membentuk generasi muda yang tangguh, terampil, dan peduli terhadap lingkungan.</p>
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
                  <p className="text-muted-foreground">Menjadi platform utama bagi pemberdayaan pemuda Indonesia dalam mengembangkan potensi sektor agro-maritim dan kehutanan yang berkelanjutan, kompetitif, dan berkontribusi terhadap kesejahteraan masyarakat.</p>
              </div>
              <div className="space-y-3">
                  <h3 className="font-headline text-2xl font-semibold">Misi Kami</h3>
                  <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Mengembangkan kapasitas dan keterampilan pemuda melalui pelatihan dan pendampingan.</li>
                      <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Membangun jaringan kolaborasi yang melibatkan pemuda, pemerintah, akademisi, dan pelaku industri.</li>
                      <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Mempromosikan praktik berkelanjutan dalam pengelolaan sumber daya alam.</li>
                       <li className="flex items-start gap-2"><Leaf className="h-5 w-5 text-primary mt-1 shrink-0" />Mendorong kewirausahaan di kalangan pemuda untuk meningkatkan kesejahteraan ekonomi.</li>
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
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Kami memusatkan perhatian pada tiga sektor utama yang menjadi pilar pembangunan berkelanjutan di Indonesia.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard icon={<Sprout size={28} />} title="Agro">Mengembangkan pertanian berkelanjutan melalui inovasi teknologi, praktik ramah lingkungan, dan peningkatan produktivitas untuk mendukung ketahanan pangan.</FeatureCard>
              <FeatureCard icon={<Ship size={28} />} title="Maritim">Memberdayakan potensi kelautan dan perikanan melalui pengelolaan sumber daya laut yang berkelanjutan dan pengembangan budidaya perikanan.</FeatureCard>
              <FeatureCard icon={<TreePine size={28} />} title="Kehutanan">Melestarikan ekosistem hutan melalui kegiatan konservasi, rehabilitasi, dan pemanfaatan hasil hutan non-kayu secara berkelanjutan.</FeatureCard>
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
              <FeatureCard icon={<Users size={28} />} title="Jaringan & Kolaborasi">Terhubung dengan pakar industri, peneliti, investor, dan sesama inovator muda.</FeatureCard>
              <FeatureCard icon={<Leaf size={28} />} title="Pendidikan & Pelatihan">Akses ke pelatihan keterampilan teknis dan manajerial, lokakarya inovasi, serta sertifikasi profesional.</FeatureCard>
              <FeatureCard icon={<Sprout size={28} />} title="Dukungan & Pendanaan">Dapatkan pendampingan proyek serta informasi dan fasilitasi untuk akses pendanaan.</FeatureCard>
            </div>
             <div className="mt-12 text-center">
                <Button size="lg" asChild>
                    <Link href="/register">Daftarkan Diri Anda</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
