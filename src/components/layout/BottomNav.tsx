
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users, Sprout, CalendarDays, Briefcase, Award, FolderKanban } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const navItems = [
  { href: '/feed', label: 'Beranda', icon: LayoutGrid },
  { href: '/members', label: 'Anggota', icon: Users },
  { href: '/programs', label: 'Program', icon: Sprout },
  { href: '/events', label: 'Acara', icon: CalendarDays },
];

const directoryItems = [
    { href: '#', label: 'Loker', icon: Briefcase },
    { href: '#', label: 'Prestasi', icon: Award },
    { href: '#', label: 'Mitra', icon: Users }
]

const DirectorySheet = () => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                 <div
                    className={cn(
                        'relative flex flex-col items-center justify-center gap-1 text-sm transition-colors hover:text-primary',
                        'text-muted-foreground'
                    )}
                    >
                    <FolderKanban className="h-5 w-5" />
                    <span className="text-xs">Direktori</span>
                </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-lg">
                <SheetHeader className="text-left">
                    <SheetTitle>Direktori</SheetTitle>
                    <SheetDescription>
                        Jelajahi peluang, lihat prestasi, dan kenali mitra kami.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-4">
                    {directoryItems.map(item => (
                         <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 hover:bg-secondary">
                            <item.icon className="h-6 w-6 text-primary" />
                            <span className="font-medium text-sm">{item.label}</span>
                         </Link>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

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
                'relative flex flex-col items-center justify-center gap-1 text-sm transition-colors hover:text-primary',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        <DirectorySheet />
      </nav>
    </div>
  );
}
