
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
import { usePanelBadges } from '@/hooks/use-panel-badges';
import { Badge } from '../ui/badge';
import { panelDirectoryItems } from '@/lib/definitions';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarMenuBadge } from '../ui/sidebar';

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
             <SidebarMenuButton asChild isActive={pathname === '/panel/dashboard'} tooltip={{children: 'Dasbor'}}>
                  <Link href="/panel/dashboard">
                    <Home />
                    <span>Dasbor</span>
                  </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
           {panelDirectoryItems.map((group) => {
              const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId));
              if (visibleItems.length === 0) return null;
              
              return (
                  <SidebarGroup key={group.group}>
                      <SidebarGroupLabel asChild>
                          <div className="flex items-center gap-2">
                             {group.icon && <group.icon />}
                             <span>{group.group}</span>
                          </div>
                      </SidebarGroupLabel>
                      {visibleItems.map(item => {
                          const isActive = pathname.startsWith(item.href);
                          const badgeCount = (item.href === '/panel/members' && badges.pendingMembers > 0) 
                              ? badges.pendingMembers 
                              : 0;
                          return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={isActive} tooltip={{children: item.label}}>
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                                {badgeCount > 0 && <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>}
                            </SidebarMenuItem>
                          )
                      })}
                  </SidebarGroup>
              )
           })}
        </SidebarMenu>
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
