'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users, Sprout, CalendarDays, Award } from 'lucide-react';

const navItems = [
  { href: '/feed', label: 'Beranda', icon: LayoutGrid },
  { href: '/members', label: 'Anggota', icon: Users },
  { href: '/programs', label: 'Program', icon: Sprout },
  { href: '/events', label: 'Acara', icon: CalendarDays },
  { href: '/benefits', label: 'Level', icon: Award, special: true },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 z-40 h-16 w-full max-w-lg border-t bg-background/70 backdrop-blur-lg">
      <nav className="grid h-full grid-cols-5 items-center">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-sm transition-colors hover:text-primary',
                isActive ? 'text-primary' : 'text-muted-foreground',
                item.special && isActive && 'rounded-full bg-primary/10 p-2 text-primary'
              )}
            >
              <item.icon className={cn(
                  "h-5 w-5",
                  item.special && isActive && "text-amber-500"
              )} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
