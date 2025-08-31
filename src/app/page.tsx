
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Sprout, Award, Ship, TreePine } from 'lucide-react';
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
              Melestarikan Alam, Memberdayakan Pemuda
            </h1>
            <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
             Garda Lestari adalah organisasi kepemudaan yang berfokus pada inovasi di sektor agro, maritim, dan kehutanan untuk masa depan Indonesia yang berkelanjutan.
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

        <section id="features" className="w-full bg-secondary py-16 md:py-28 lg:py-36">
          <div className="container">
            <div className="mb-14 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Fokus Utama Kami</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Kami bergerak di tiga sektor utama yang menjadi pilar kekuatan alam Indonesia, dengan pemuda sebagai garda terdepan perubahan.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sprout className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Agro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Mengembangkan inovasi pertanian modern, ketahanan pangan, dan mencetak wirausahawan tani muda.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Ship className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Maritim</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Memajukan ekonomi biru melalui pengelolaan sumber daya laut yang berkelanjutan dan konservasi ekosistem pesisir.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TreePine className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Kehutanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Menjaga kelestarian hutan melalui program reforestasi, perhutanan sosial, dan pencegahan deforestasi.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div className="flex items-center gap-2">
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
