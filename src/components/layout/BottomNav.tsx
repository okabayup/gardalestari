
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users, Sprout, FolderKanban, Sparkles, Dot } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { directoryItems, panelDirectoryItems, PermissionId } from '@/lib/definitions';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const mainNavItems = [
  { href: '/feed', label: 'Beranda', icon: LayoutGrid },
  { href: '/members', label: 'Anggota', icon: Users },
  { href: '/programs', label: 'Program', icon: Sprout },
  { href: '/assistant', label: 'Agen AI', icon: Sparkles },
];

const DirectorySheet = () => {
    const { hasPermission } = useAuth();
    
    // Filter only the panel groups the user has permission to see
    const accessiblePanelGroups = panelDirectoryItems.map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId))
    })).filter(group => group.items.length > 0);

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
                    <span className="text-xs">Lainnya</span>
                </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-lg h-[80vh] flex flex-col">
                <SheetHeader className="text-left">
                    <SheetTitle>Direktori</SheetTitle>
                    <SheetDescription>
                        Jelajahi semua fitur dan informasi yang tersedia di aplikasi.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-2" />
                <ScrollArea className="flex-1 -mx-6 px-6">
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4">
                        {directoryItems.map(item => (
                            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary">
                                <item.icon className="h-6 w-6 text-primary" />
                                <span className="font-medium text-xs text-center">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
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
        <DirectorySheet />
      </nav>
    </div>
  );
}
