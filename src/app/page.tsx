import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Sprout, Award } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl">Garda Lestari</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container text-center">
            <div className="absolute inset-0 -z-10">
                <Image
                    src="https://picsum.photos/1920/1080"
                    alt="Lush green forest"
                    data-ai-hint="lush forest"
                    fill
                    className="object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Preserving Nature, Together
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Join Garda Lestari and become part of a community dedicated to environmental conservation and sustainable living.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Become a Member</Link>
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="w-full bg-background py-12 md:py-24 lg:py-32">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Why Join Us?</h2>
              <p className="mt-2 text-muted-foreground">Explore the benefits and features of a Garda Lestari membership.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Digital Membership</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Register seamlessly and get your digital membership card instantly.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Community Hub</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Connect with fellow members, share updates, and browse our member directory.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sprout className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Exclusive Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Participate in our flagship conservation programs, events, and read our blog.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Personalized Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Get AI-powered recommendations for benefits that match your profile.</p>
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
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Garda Lestari. All rights reserved.</p>
          </div>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
