
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getAppSettings } from '@/app/actions/settings';
import { useEffect, useState } from 'react';

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
        <nav className="ml-auto hidden items-center gap-4 md:flex">
            <Link href="/programs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Program</Link>
            <Link href="/events" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Acara</Link>
            <Link href="/blog" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Blog</Link>
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
              <Button variant="ghost" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              {isRegistrationOpen && (
                <Button asChild>
                  <Link href="/register">Daftar</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
