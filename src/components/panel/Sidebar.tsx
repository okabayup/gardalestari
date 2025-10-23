

'use client';

import Link from 'next/link';
import {
  Home,
  Menu,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import type { PermissionId } from '@/lib/definitions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePanelBadges, PanelBadgesProvider } from '@/hooks/use-panel-badges';
import { Badge } from '../ui/badge';
import { panelDirectoryItems } from '@/lib/definitions';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '../ui/sidebar';

export function PanelSidebarContent() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const { badges } = usePanelBadges();

  const defaultAccordionValue = panelDirectoryItems.find(group => 
      group.group && group.items.some(item => pathname.startsWith(item.href))
  )?.group;

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
             <SidebarMenuButton asChild isActive={pathname === '/panel/dashboard'}>
                  <Link href="/panel/dashboard">
                    <Home />
                    <span>Dasbor</span>
                  </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Accordion type="single" collapsible defaultValue={defaultAccordionValue} className="w-full">
            {panelDirectoryItems.map((group) => {
                const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId));
                if (visibleItems.length === 0) return null;
                
                return (
                    <AccordionItem key={group.group} value={group.group} className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline rounded-lg px-3 hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
                             <div className="flex items-center gap-3 text-muted-foreground">
                                {group.icon && <group.icon className="h-4 w-4" />}
                                <span className="group-data-[collapsible=icon]:hidden">{group.group}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-7 pt-1 space-y-1 group-data-[collapsible=icon]:hidden">
                            {visibleItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                const badgeCount = item.href === '/panel/members' ? badges.pendingMembers : 0;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-xs',
                                            isActive && 'bg-muted/50 text-primary font-semibold'
                                        )}
                                    >
                                        <item.icon className="h-3 w-3" />
                                        {item.label}
                                        {badgeCount > 0 && (
                                            <Badge variant="secondary" className="ml-auto">{badgeCount}</Badge>
                                        )}
                                    </Link>
                                )
                            })}
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
      </SidebarContent>
    </>
  );
}

export function Sidebar() {
    return (
        <PanelBadgesProvider>
            <PanelSidebarContent />
        </PanelBadgesProvider>
    )
}
