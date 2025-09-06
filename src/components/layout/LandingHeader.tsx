
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Menu } from 'lucide-react';
import { getAppSettings } from '@/app/actions/settings';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '../ui/separator';

const navItems = [
  { href: '/berita', label: 'Berita' },
  { 
    label: 'Tentang Kami', 
    subItems: [
      { href: '/#about', label: 'Struktur Organisasi' },
      { href: '/#about', label: 'Lambang' },
      { href: '/#about', label: 'Dewan Kehormatan' },
      { href: '/#about', label: 'DPP' },
      { href: '/#about', label: 'DPD' },
      { href: '/#about', label: 'DPC' },
    ]
  },
  { href: '/programs', label: 'Program' },
];


export default function LandingHeader() {
  const { user, loading } = useAuth();
  const [isRegistrationOpen, setRegistrationOpen] = useState(true);

   useEffect(() => {
    const checkRegistrationStatus = async () => {
        const settings = await getAppSettings();
        setRegistrationOpen(settings.isRegistrationOpen);
    };
    checkRegistrationStatus();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 md:flex">
            <Link href="/berita" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Berita</Link>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary p-0">
                  Tentang Kami
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {navItems.find(i => i.label === 'Tentang Kami')?.subItems?.map(sub => (
                   <DropdownMenuItem key={sub.label} asChild><Link href={sub.href}>{sub.label}</Link></DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/programs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Program</Link>
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
              <Button variant="ghost" className="hidden md:inline-flex" asChild>
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
                   <div className="p-6">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
                        </Link>
                    </div>
                    <Separator />
                    <nav className="p-6 space-y-4">
                        <SheetClose asChild>
                            <Link href="/berita" className="block text-lg font-medium text-foreground">Berita</Link>
                        </SheetClose>
                         <div>
                            <p className="text-lg font-medium text-foreground">Tentang Kami</p>
                            <div className="pl-4 mt-2 space-y-2 text-muted-foreground">
                                {navItems.find(i => i.label === 'Tentang Kami')?.subItems?.map(sub => (
                                    <SheetClose asChild key={sub.label}>
                                       <Link href={sub.href} className="block hover:text-primary">{sub.label}</Link>
                                    </SheetClose>
                                ))}
                            </div>
                         </div>
                        <SheetClose asChild>
                           <Link href="/programs" className="block text-lg font-medium text-foreground">Program</Link>
                        </SheetClose>
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
  );
}
