'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getAppSettings } from '@/app/actions/settings';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/tentang', label: 'About Us' },
  { href: '/programs', label: 'Services' },
  { href: '/events', label: 'Event' },
  { href: '/berita', label: 'Blog' },
];

export default function LandingHeader() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isRegistrationOpen, setRegistrationOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchSettings() {
        try {
            const settings = await getAppSettings();
            setRegistrationOpen(settings.isRegistrationOpen);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    }
    fetchSettings();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (!mounted) return null;

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center",
      scrolled ? "pt-2" : "pt-6"
    )}>
      <div className={cn(
        "container max-w-6xl transition-all duration-500",
        scrolled ? "px-4" : "px-6"
      )}>
        <div className={cn(
          "flex items-center justify-between px-6 py-3 transition-all duration-500",
          scrolled 
            ? "bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full py-2" 
            : "bg-white/50 backdrop-blur-sm border border-white/10 rounded-[2rem]"
        )}>
          <Link href="/" className="flex items-center shrink-0 group">
            <div className="relative w-10 h-10 md:w-12 md:h-12 mr-3 transition-transform group-hover:rotate-12">
              <Image src="/logo.png" alt="Garda Lestari Logo" fill className="object-contain" />
            </div>
            <div className="hidden sm:block leading-none">
              <span className="text-xl font-black tracking-tighter text-accent uppercase block">Garda</span>
              <span className="text-xs font-black tracking-widest text-primary uppercase">Lestari</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-10">
              {navItems.map(item => (
                   <Link 
                    key={item.href} 
                    href={item.href} 
                    className="text-sm font-black uppercase tracking-widest text-accent/70 hover:text-primary transition-all relative group"
                   >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                   </Link>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : user ? (
              <Button asChild className="rounded-full px-8 font-black uppercase tracking-widest text-xs h-11 shadow-lg shadow-primary/20">
                <Link href="/feed">Dasbor</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="hidden md:inline-flex font-black uppercase tracking-widest text-xs h-11 text-accent/70" asChild>
                  <Link href="/login">Masuk</Link>
                </Button>
                {isRegistrationOpen && (
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-8 font-black uppercase tracking-widest text-xs h-11 shadow-lg shadow-primary/20">
                    <Link href="/register">Gabung</Link>
                  </Button>
                )}
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden rounded-full border-none bg-accent/5 hover:bg-accent/10 h-11 w-11">
                      <Menu className="h-6 w-6 text-accent" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="top" className="rounded-b-[3rem] border-none pt-12 pb-12 bg-white/95 backdrop-blur-2xl">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu Navigasi</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col items-center gap-8">
                       {navItems.map(item => (
                          <SheetClose asChild key={item.href}>
                              <Link href={item.href} className="text-2xl font-black uppercase tracking-tighter text-accent hover:text-primary transition-colors">
                                {item.label}
                              </Link>
                          </SheetClose>
                       ))}
                       <div className="flex flex-col w-full gap-4 pt-4">
                        {!user && (
                          <>
                            <Button asChild variant="outline" className="w-full rounded-full h-14 font-black uppercase tracking-widest">
                              <Link href="/login">Masuk Akun</Link>
                            </Button>
                            {isRegistrationOpen && (
                              <Button asChild className="w-full rounded-full h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                                <Link href="/register">Daftar Sekarang</Link>
                              </Button>
                            )}
                          </>
                        )}
                       </div>
                  </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
