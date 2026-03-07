'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Menu, X } from 'lucide-react';
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4 md:py-6",
      scrolled && "py-2"
    )}>
      <div className="container max-w-7xl px-4 md:px-6">
        <div className={cn(
          "flex items-center justify-between px-4 md:px-8 py-3 transition-all duration-500 rounded-full",
          scrolled 
            ? "bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl" 
            : "bg-transparent"
        )}>
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image 
              src="/logo.png" 
              alt="Garda Lestari Logo" 
              width={140} 
              height={40} 
              className={cn("h-8 md:h-10 w-auto transition-all", !scrolled && "brightness-0 invert")} 
            />
          </Link>
          
          {/* Desktop Navigation (Hidden on Tablet & Mobile) */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {navItems.map(item => (
                   <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                      "text-xs xl:text-sm font-bold uppercase tracking-widest transition-all relative group",
                      scrolled ? "text-accent" : "text-white hover:text-primary"
                    )}
                   >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                   </Link>
              ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="secondary" className="hidden sm:flex rounded-full bg-[#E8F0E5] text-accent hover:bg-primary hover:text-white px-6 md:px-8 h-10 md:h-11 font-bold uppercase tracking-widest text-[10px] md:text-xs">
              Donate
            </Button>
            
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : user ? (
              <Button asChild className="rounded-full px-6 md:px-8 font-bold uppercase tracking-widest text-[10px] md:text-xs h-10 md:h-11 shadow-lg shadow-primary/20">
                <Link href="/feed">Join Us</Link>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-6 md:px-8 font-bold uppercase tracking-widest text-[10px] md:text-xs h-10 md:h-11 shadow-lg shadow-primary/20">
                <Link href="/register">Join Us</Link>
              </Button>
            )}

            {/* Mobile/Tablet Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("lg:hidden rounded-full h-10 w-10 md:h-11 md:w-11", !scrolled && "text-white")}>
                      <Menu className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="top" className="rounded-b-[2rem] md:rounded-b-[3rem] border-none pt-12 pb-12 bg-white/95 backdrop-blur-2xl">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu Navigasi</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col items-center gap-6 md:gap-8">
                       {navItems.map(item => (
                          <SheetClose asChild key={item.href}>
                              <Link href={item.href} className="text-xl md:text-2xl font-black uppercase tracking-tighter hover:text-primary transition-colors text-accent">
                                {item.label}
                              </Link>
                          </SheetClose>
                       ))}
                       <div className="flex flex-col w-full gap-4 pt-4 px-6 sm:hidden">
                          <Button variant="secondary" className="w-full rounded-full h-12 font-bold uppercase tracking-widest text-xs">Donate</Button>
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
