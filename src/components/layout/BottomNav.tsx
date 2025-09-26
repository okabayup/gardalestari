
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users, Sprout, FolderKanban, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Assistant from '../assistant/Assistant';
import { directoryItems } from '@/lib/definitions';

const mainNavItems = [
  { href: '/feed', label: 'Beranda', icon: LayoutGrid },
  { href: '/members', label: 'Anggota', icon: Users },
  { href: '/programs', label: 'Program', icon: Sprout },
];

const DirectorySheet = () => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                 <div
                    className={cn(
                        'relative flex h-full flex-col items-center justify-center gap-1 text-sm transition-colors hover:text-primary',
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
                        Jelajahi informasi, peluang, dan sumber daya penting lainnya.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-4">
                    {directoryItems.map(item => (
                         <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 hover:bg-secondary">
                            <item.icon className="h-6 w-6 text-primary" />
                            <span className="font-medium text-sm text-center">{item.label}</span>
                         </Link>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (user?.verificationStatus === 'unverified') {
    return null;
  }

  return (
    <div className="fixed bottom-0 z-40 h-16 w-full max-w-lg border-t bg-background/70 backdrop-blur-lg left-1/2 -translate-x-1/2">
      <nav className="grid h-full grid-cols-5 items-center">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-full flex-col items-center justify-center gap-1 p-1 text-sm transition-colors hover:text-primary',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        {/* Assistant as a standard menu item */}
        <div className={cn(
            'relative flex h-full flex-col items-center justify-center gap-1 p-1 text-sm transition-colors hover:text-primary',
            'text-muted-foreground'
        )}>
            <Assistant />
        </div>
        <DirectorySheet />
      </nav>
    </div>
  );
}
