
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
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
  Bell,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const navItems = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/notifications', icon: Bell, label: 'Notifikasi' },
    { href: '/panel/berita', icon: Newspaper, label: 'Berita' },
    { href: '/panel/events', icon: Calendar, label: 'Acara' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program' },
    { href: '/panel/members', icon: Users, label: 'Anggota' },
    { href: '/panel/partners', icon: Handshake, label: 'Mitra' },
    { href: '/panel/forms', icon: FileText, label: 'Formulir' },
    { href: '/panel/landing', icon: Landmark, label: 'Landing' },
    { href: '/panel/settings', icon: Settings, label: 'Pengaturan' },
];

export default function PanelBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-0 left-0 z-40 h-16 w-full border-t bg-background/95 backdrop-blur-lg md:hidden">
      <ScrollArea className="h-full w-full whitespace-nowrap">
        <nav className="flex h-full items-center justify-start px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-full flex-col items-center justify-center gap-1 p-2 text-sm transition-colors hover:text-primary w-20',
                pathname.startsWith(item.href) ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
