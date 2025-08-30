'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users, Sprout, CalendarDays, UserCircle } from 'lucide-react';

const navItems = [
  { href: '/feed', label: 'Feed', icon: LayoutGrid },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/programs', label: 'Programs', icon: Sprout },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 z-40 h-16 w-full max-w-lg border-t bg-background/70 backdrop-blur-lg">
      <nav className="grid h-full grid-cols-5 items-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary',
              (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')) && 'text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
