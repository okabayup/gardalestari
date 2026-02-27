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
import InstallGate from './InstallGate';

const navItems = [
  { href: '/berita', label: 'Berita' },
  { href: '/tentang', label: 'Tentang Kami' },
  { href: '/programs', label: 'Program' },
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
  
  // Hydration safety: Return a stable skeleton until mounted on client
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
          </Link>
        </div>
      </header>
    );
  }

  // If user is logged in but has not completed KTP verification, show the flow.
  if (user && user.verificationStatus === 'unverified') {
    return <VerificationFlow />;
  }

  return (
    <>
    <InstallGate />
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 md:flex">
            {navItems.map(item => (
                 <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">{item.label}</Link>
            ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <Button asChild>
              <Link href="/feed">Buka Aplikasi</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" className="hidden md:inline-flex" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              {isRegistrationOpen && (
                <Button asChild className="hidden md:inline-flex">
                  <Link href="/register">Daftar</Link>
                </Button>
              )}
            </>
          )}

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Buka Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Menu Utama</SheetTitle>
                        <SheetDescription>Navigasi utama untuk halaman Garda Lestari.</SheetDescription>
                    </SheetHeader>
                   <div className="p-6">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
                        </Link>
                    </div>
                    <Separator />
                    <nav className="p-6 space-y-4">
                         {navItems.map(item => (
                            <SheetClose asChild key={item.href}>
                                <Link href={item.href} className="block text-lg font-medium text-foreground">{item.label}</Link>
                            </SheetClose>
                         ))}
                    </nav>
                    {!user && (
                         <div className="absolute bottom-6 left-6 right-6 space-y-2">
                             <Button asChild className="w-full"><Link href="/login">Masuk</Link></Button>
                            {isRegistrationOpen && <Button asChild variant="secondary" className="w-full"><Link href="/register">Daftar</Link></Button>}
                         </div>
                    )}
                </SheetContent>
            </Sheet>

        </div>
      </div>
    </header>
    </>
  );
}
