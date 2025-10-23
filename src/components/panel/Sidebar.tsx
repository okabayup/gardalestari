
'use client';

import Link from 'next/link';
import {
  Home,
  ChevronLeft
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import type { PermissionId } from '@/lib/definitions';
import { usePanelBadges } from '@/hooks/use-panel-badges';
import { Badge } from '../ui/badge';
import { panelDirectoryItems } from '@/lib/definitions';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function PanelSidebarContent() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const { badges } = usePanelBadges();

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <span className="text-base group-data-[collapsible=icon]:hidden">Garda Lestari</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip={{children: 'Kembali ke Beranda'}}>
                  <Link href="/feed">
                    <ChevronLeft />
                    <span>Kembali ke Beranda</span>
                  </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={pathname === '/panel/dashboard'} tooltip={{children: 'Dasbor'}}>
                  <Link href="/panel/dashboard">
                    <Home />
                    <span>Dasbor</span>
                  </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Accordion type="multiple" defaultValue={panelDirectoryItems.map(g => g.group)} className="w-full">
           {panelDirectoryItems.map((group) => {
              const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId));
              if (visibleItems.length === 0) return null;
              
              return (
                  <AccordionItem value={group.group} key={group.group} className="border-none">
                     <AccordionTrigger className="px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                         <div className="flex items-center gap-2">
                           {group.icon && <group.icon className="h-4 w-4"/>}
                           <span className="group-data-[collapsible=icon]:hidden">{group.group}</span>
                         </div>
                     </AccordionTrigger>
                     <AccordionContent className="pb-0">
                        <SidebarMenu className="pl-4 group-data-[collapsible=icon]:pl-0">
                          {visibleItems.map(item => {
                              const isActive = pathname.startsWith(item.href);
                              const badgeCount = (item.href === '/panel/members' && badges.pendingMembers > 0) 
                                  ? badges.pendingMembers 
                                  : 0;
                              return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={isActive} tooltip={{children: item.label}} size="sm">
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {badgeCount > 0 && <Badge className="absolute right-2 top-1.5 group-data-[collapsible=icon]:hidden">{badgeCount}</Badge>}
                                </SidebarMenuItem>
                              )
                          })}
                        </SidebarMenu>
                     </AccordionContent>
                  </AccordionItem>
              )
           })}
        </Accordion>
      </SidebarContent>
    </>
  );
}

// This export is kept for potential direct use, though PanelSidebarContent is the main export now.
export function Sidebar() {
    return (
        <PanelSidebarContent />
    )
}
