
'use client';

import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  Newspaper,
  Calendar,
  Users,
  Settings,
  Megaphone,
  FileText,
  Handshake,
  Landmark,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ADMIN_PHONE_NUMBER = '+6285176752610';

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  const navItems = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor', admin: true },
    { href: '/panel/berita', icon: Newspaper, label: 'Berita', admin: false },
    { href: '/panel/events', icon: Calendar, label: 'Acara', admin: false },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', admin: false },
    { href: '/panel/members', icon: Users, label: 'Anggota', admin: true },
    { href: '/panel/partners', icon: Handshake, label: 'Mitra', admin: true },
    { href: '/panel/forms', icon: FileText, label: 'Formulir', admin: true },
    { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', admin: true },
    { href: '/panel/settings', icon: Settings, label: 'Pengaturan', admin: true },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Image src="/logo.png" alt="Logo" width={24} height={24} />
          <span className="sr-only">Garda Lestari</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => 
            (item.admin ? isAdmin : true) && (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith(item.href) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
           )
          )}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
        <TooltipProvider>
             <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Keluar</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right">Keluar</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
