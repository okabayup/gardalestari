
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '../ui/separator';
import VerificationFlow from '../auth/VerificationFlow';
import { getAppSettings } from '@/app/actions/settings';

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
  }, []);
  
  if (!mounted) return null;

  if (user && user.verificationStatus === 'unverified') {
    return <VerificationFlow />;
  }

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
      <div className="bg-white/80 backdrop-blur-md border rounded-full px-6 py-3 flex items-center justify-between shadow-lg">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="Garda Lestari Logo" width={100} height={30} className="h-8 w-auto" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
                 <Link key={item.href} href={item.href} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{item.label}</Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : user ? (
            <Button asChild className="rounded-full px-6">
              <Link href="/feed">App</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="hidden md:inline-flex font-bold" asChild>
                <Link href="/login">Login</Link>
              </Button>
              {isRegistrationOpen && (
                <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-6 font-bold">
                  <Link href="/register">Sign Up</Link>
                </Button>
              )}
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden rounded-full border-none bg-muted">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="top" className="rounded-b-[2rem]">
                <nav className="flex flex-col items-center gap-6 py-8">
                     {navItems.map(item => (
                        <SheetClose asChild key={item.href}>
                            <Link href={item.href} className="text-xl font-bold">{item.label}</Link>
                        </SheetClose>
                     ))}
                     {!user && <Button asChild className="w-full rounded-full"><Link href="/login">Login</Link></Button>}
                </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
