

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
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
  ChevronLeft,
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
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import type { PermissionId } from '@/lib/definitions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { usePanelBadges, PanelBadgesProvider } from '@/hooks/use-panel-badges';
import { Badge } from '../ui/badge';


const mainNavItems = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/berita', icon: Newspaper, label: 'Konten', permission: 'manage_news' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
    { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users', badge: 'pendingMembers' as const },
];

const groupedNavItems: {
  group: string;
  items: { href: string; icon: React.ElementType; label: string, permission?: PermissionId }[];
}[] = [
   {
    group: 'Analitik',
    items: [
      { href: '/panel/performance', icon: TrendingUp, label: 'Performa', permission: 'manage_settings' },
      { href: '/panel/analytics/errors', icon: Bug, label: 'Log Error', permission: 'manage_settings' },
    ]
  },
  {
    group: 'Publikasi',
    items: [
      { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
      { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', permission: 'manage_landing_page' },
    ],
  },
  {
    group: 'Keterlibatan Anggota',
    items: [
      { href: '/panel/ideas', icon: Lightbulb, label: 'Bank Ide', permission: 'manage_ideas'},
      { href: '/panel/announcements', icon: Megaphone, label: 'Pengumuman', permission: 'manage_announcements'},
      { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
      { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
      { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
      { href: '/panel/badges', icon: Award, label: 'Lencana', permission: 'manage_badges' },
    ],
  },
  {
    group: 'Program & Peluang',
    items: [
       { href: '/panel/recruitments', icon: Briefcase, label: 'Rekrutmen', permission: 'manage_recruitments' },
       { href: '/panel/partners', icon: Handshake, label: 'Mitra', permission: 'manage_partners' },
    ]
  },
  {
    group: 'Poin Hijau',
    items: [
       { href: '/panel/redeem', icon: Gift, label: 'Item Hadiah', permission: 'manage_settings' },
       { href: '/panel/missions', icon: Target, label: 'Misi', permission: 'manage_settings' },
       { href: '/panel/redeem/history', icon: BookCopy, label: 'Riwayat Penukaran', permission: 'manage_settings' },
    ]
  },
  {
    group: 'E-Office',
    items: [
        { href: '/panel/documents', icon: BookCopy, label: 'Surat & Dokumen', permission: 'manage_documents'},
        { href: '/panel/projects', icon: KanbanSquare, label: 'Manajemen Proyek', permission: 'manage_projects' },
        { href: '/panel/whatsapp', icon: MessageCircle, label: 'Manajemen WhatsApp', permission: 'manage_whatsapp' },
    ]
  },
  {
    group: 'Manajemen Internal',
    items: [
      { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
      { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
      { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
      { href: '/panel/map-datasets', icon: Layers, label: 'Dataset Peta', permission: 'manage_map_datasets' },
      { href: '/panel/data-bank', icon: Database, label: 'Bank Data', permission: 'manage_data_bank'},
    ],
  },
   {
    group: 'Pengaturan',
    items: [
      { href: '/panel/settings', icon: Settings, label: 'Pengaturan Aplikasi', permission: 'manage_settings' },
    ],
  },
];


const MoreMenuSheet = () => {
    const { hasPermission } = useAuth();
    const pathname = usePathname();
    const defaultAccordionValue = groupedNavItems.find(group => 
      group.items.some(item => pathname.startsWith(item.href))
    )?.group;
    
    return (
        <Sheet>
            <SheetTrigger asChild>
                 <div
                    className={cn(
                        'relative flex flex-col items-center justify-center gap-1 text-sm transition-colors hover:text-primary',
                        'text-muted-foreground'
                    )}
                    >
                    <Menu className="h-5 w-5" />
                    <span className="text-xs">Lainnya</span>
                </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-lg h-[80vh]">
                <SheetHeader className="text-left">
                    <SheetTitle>Menu Lainnya</SheetTitle>
                    <SheetDescription>
                        Akses cepat ke semua fitur manajemen panel admin.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4" />
                 <ScrollArea className="h-[calc(80vh-8rem)]">
                   <Accordion type="single" collapsible defaultValue={defaultAccordionValue} className="w-full">
                        {groupedNavItems.map(group => {
                            const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission));
                            if (visibleItems.length === 0) return null;
                            
                            return (
                                <AccordionItem value={group.group} key={group.group}>
                                    <AccordionTrigger>{group.group}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-col space-y-1 pl-4">
                                            {visibleItems.map(item => (
                                                <Link key={item.href} href={item.href} className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm',
                                                    pathname.startsWith(item.href) && 'bg-muted text-primary font-semibold'
                                                )}>
                                                    <item.icon className="h-4 w-4" />
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}


function PanelBottomNavComponent() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const { badges } = usePanelBadges();
  
  if (!user || !user.permissions || user.permissions.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 z-40 h-16 w-full border-t bg-background/95 backdrop-blur-lg md:hidden">
      <nav className="grid h-full grid-cols-5 items-center">
        {mainNavItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return <div key={item.href} />;
            }
            const isActive = pathname.startsWith(item.href);
            const badgeCount = item.badge ? badges[item.badge] : 0;
            return (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'relative flex h-full flex-col items-center justify-center gap-1 p-1 text-sm transition-colors hover:text-primary',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}
                >
                  {badgeCount > 0 && (
                     <Badge className="absolute top-1 right-2 h-4 w-4 justify-center p-0 text-[10px]" variant="destructive">{badgeCount > 9 ? '9+' : badgeCount}</Badge>
                  )}
                <item.icon className="h-5 w-5" />
                <span className="text-xs truncate">{item.label}</span>
                </Link>
          )})}
          <MoreMenuSheet />
      </nav>
    </div>
  );
}

export default function PanelBottomNav() {
    return (
        <PanelBadgesProvider>
            <PanelBottomNavComponent />
        </PanelBadgesProvider>
    )
}
