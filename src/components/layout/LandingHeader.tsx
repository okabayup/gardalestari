'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/tentang', label: 'About Us' },
  { href: '/programs', label: 'Features' },
  { href: '/events', label: 'Our Work' },
  { href: '/berita', label: 'Spotlight' },
];

export default function LandingHeader() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (!mounted) return null;

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-6",
      scrolled && "py-2"
    )}>
      <div className="container max-w-6xl px-6">
        <div className={cn(
          "flex items-center justify-between px-8 py-3 transition-all duration-500 rounded-full",
          scrolled 
            ? "bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl" 
            : "bg-transparent"
        )}>
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.png" alt="Garda Lestari Logo" width={140} height={40} className="h-10 w-auto" />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-10">
              {navItems.map(item => (
                   <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest transition-all relative group",
                      scrolled ? "text-accent" : "text-white hover:text-primary"
                    )}
                   >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                   </Link>
              ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="secondary" className="hidden md:flex rounded-full bg-[#E8F0E5] text-accent hover:bg-primary hover:text-white px-8 h-11 font-bold uppercase tracking-widest text-xs">
              Donate
            </Button>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : user ? (
              <Button asChild className="rounded-full px-8 font-bold uppercase tracking-widest text-xs h-11">
                <Link href="/feed">Join Us</Link>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-8 font-bold uppercase tracking-widest text-xs h-11">
                <Link href="/register">Join Us</Link>
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("lg:hidden rounded-full h-11 w-11", !scrolled && "text-white")}>
                      <Menu className="h-6 w-6" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="top" className="rounded-b-[3rem] border-none pt-12 pb-12 bg-white/95 backdrop-blur-2xl">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu Navigasi</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col items-center gap-8">
                       {navItems.map(item => (
                          <SheetClose asChild key={item.href}>
                              <Link href={item.href} className="text-2xl font-black uppercase tracking-tighter hover:text-primary transition-colors">
                                {item.label}
                              </Link>
                          </SheetClose>
                       ))}
                  </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
