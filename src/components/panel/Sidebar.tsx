
'use client';

import Link from 'next/link';
import {
  Home,
  ChevronLeft
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { PermissionId } from '@/lib/definitions';
import { usePanelBadges } from '@/hooks/use-panel-badges';
import { Badge } from '../ui/badge';
import { panelDirectoryItems } from '@/lib/definitions';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function PanelSidebarContent() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const { badges } = usePanelBadges();

  return (
    <>
       <div className="flex h-16 items-center border-b px-6 shrink-0">
           <Link href="/panel/dashboard" className="flex items-center gap-2 font-semibold">
             <Image src="/logo.png" alt="Logo" width={24} height={24} />
             <span className="text-base">Panel Admin</span>
           </Link>
       </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
            <Link
              href="/feed"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
            <Link
              href="/panel/dashboard"
              className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === '/panel/dashboard' && 'bg-muted text-primary'
              )}
            >
              <Home className="h-4 w-4" />
              Dasbor
            </Link>
        
            <Accordion type="single" collapsible defaultValue="Publikasi" className="w-full">
              {panelDirectoryItems.map((group) => {
                  const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId));
                  if (visibleItems.length === 0) return null;
                  
                  return (
                      <AccordionItem value={group.group} key={group.group} className="border-none">
                        <AccordionTrigger className="px-3 py-2 text-sm text-muted-foreground hover:no-underline hover:text-primary rounded-md justify-start gap-3">
                             <div className="flex items-center gap-3">
                               {group.icon && <group.icon className="h-4 w-4"/>}
                               <span>{group.group}</span>
                             </div>
                         </AccordionTrigger>
                         <AccordionContent className="pb-0 pl-7">
                            <div className="flex flex-col gap-1">
                              {visibleItems.map(item => {
                                  const isActive = pathname.startsWith(item.href);
                                  const badgeCount = (item.href === '/panel/members' && badges.pendingMembers > 0) 
                                      ? badges.pendingMembers 
                                      : 0;
                                  return (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      className={cn(
                                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                          isActive && "bg-muted text-primary"
                                      )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                         {badgeCount > 0 && (
                                            <Badge className="ml-auto">{badgeCount}</Badge>
                                        )}
                                    </Link>
                                  )
                              })}
                            </div>
                         </AccordionContent>
                      </AccordionItem>
                  )
              })}
            </Accordion>
        </nav>
      </ScrollArea>
    </>
  );
}
