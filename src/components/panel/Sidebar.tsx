

'use client';

import Link from 'next/link';
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
  LogOut,
  ChevronRight,
  Bell,
  UserCheck,
  Briefcase,
  Award,
  Map,
  Vote,
  BookCopy,
  KanbanSquare,
  Building2,
  Menu,
  MessageCircle,
  Presentation,
  Lightbulb,
  TrendingUp,
  Layers,
  Database,
  Target,
  Gift,
  Coins,
  Bug,
  Flag,
  Wallet,
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


function SidebarComponent() {
  const pathname = usePathname();
  const { user, signOut, hasPermission } = useAuth();
  const router = useRouter();
  const { badges } = usePanelBadges();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  if (!user || !user.permissions || user.permissions.length === 0) return null;

  const defaultAccordionValue = panelDirectoryItems.find(group => 
      group.group && group.items.some(item => pathname.startsWith(item.href))
  )?.group;


  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <span className="">Garda Lestari</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
                href="/panel/dashboard"
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    pathname === '/panel/dashboard' && 'bg-muted text-primary'
                )}
                >
                <Home className="h-4 w-4" />
                Dasbor
            </Link>
            <Accordion type="single" collapsible defaultValue={defaultAccordionValue} className="w-full">
                {panelDirectoryItems.map((group, index) => {
                    const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId));
                    if (visibleItems.length === 0) return null;
                    
                    return (
                        <AccordionItem key={group.group} value={group.group} className="border-b-0">
                            <AccordionTrigger className="py-2 hover:no-underline rounded-lg px-3 hover:bg-muted">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    {group.icon && <group.icon className="h-4 w-4" />}
                                    {group.group}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-7 pt-1 space-y-1">
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
          </nav>
        </div>
        <div className="mt-auto p-4">
            <Button size="sm" variant="outline" className="w-full" onClick={() => router.push('/feed')}>
                <ChevronRight className="mr-2 h-4 w-4" />
                Kembali ke Aplikasi
            </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
    return (
        <PanelBadgesProvider>
            <SidebarComponent />
        </PanelBadgesProvider>
    )
}
