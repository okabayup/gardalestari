import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Sprout, Award } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import LandingHeader from '@/components/layout/LandingHeader';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        <section className="relative w-full py-24 md:py-36 lg:py-48">
          <div className="container text-center">
            <div className="absolute inset-0 -z-10">
                <Image
                    src="https://picsum.photos/1920/1080"
                    alt="Hutan hijau yang rimbun"
                    data-ai-hint="lush forest"
                    fill
                    className="object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Melestarikan Alam, Bersama-sama
            </h1>
            <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Bergabunglah dengan Garda Lestari dan jadilah bagian dari komunitas yang berdedikasi pada konservasi lingkungan dan kehidupan berkelanjutan.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Menjadi Anggota</Link>
              </Button>
              <Button size="lg" variant="outline">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="w-full bg-background py-16 md:py-28 lg:py-36">
          <div className="container">
            <div className="mb-14 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Mengapa Bergabung?</h2>
              <p className="mt-3 text-muted-foreground">Jelajahi manfaat dan fitur keanggotaan Garda Lestari.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Keanggotaan Digital</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Daftar dengan mudah dan dapatkan kartu tanda anggota digital Anda secara instan.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Pusat Komunitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Terhubung dengan sesama anggota, bagikan pembaruan, dan jelajahi direktori anggota kami.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sprout className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Program Eksklusif</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Berpartisipasi dalam program konservasi unggulan, acara, dan baca blog kami.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Benefit Terpersonalisasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Dapatkan rekomendasi berbasis AI untuk benefit yang sesuai dengan profil Anda.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Garda Lestari. Semua hak dilindungi.</p>
          </div>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Kebijakan Privasi</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Ketentuan Layanan</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
