
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
  Tags,
  Bell,
  UserCheck,
  FolderArchive,
  Megaphone as MegaphoneIcon,
  Briefcase,
  Award,
  Map,
  Vote,
  Mail,
  BookCopy,
  KanbanSquare,
  Building2,
  Menu,
  MessageCircle,
  Presentation,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import type { PermissionId } from '@/lib/definitions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { usePanelBadges } from '@/hooks/use-panel-badges.tsx';
import { Badge } from '../ui/badge';


const mainNavItems = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/berita', icon: Newspaper, label: 'Konten', permission: 'manage_news' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
    { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users', badge: 'pendingMembers' as const },
];

const groupedNavItems: {
  group: string;
  icon: React.ElementType;
  items: { href: string; icon: React.ElementType; label: string, permission?: PermissionId }[];
}[] = [
   {
    group: 'Analitik',
    icon: TrendingUp,
    items: [
      { href: '/panel/performance', icon: TrendingUp, label: 'Performa', permission: 'manage_settings' },
    ]
  },
  {
    group: 'Publikasi',
    icon: Presentation,
    items: [
      { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
      { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', permission: 'manage_landing_page' },
    ],
  },
  {
    group: 'Keterlibatan Anggota',
    icon: Lightbulb,
    items: [
      { href: '/panel/ideas', icon: Lightbulb, label: 'Bank Ide', permission: 'manage_ideas'},
      { href: '/panel/announcements', icon: MegaphoneIcon, label: 'Pengumuman', permission: 'manage_announcements'},
      { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
      { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
      { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
    ],
  },
  {
    group: 'Program & Peluang',
    icon: Briefcase,
    items: [
       { href: '/panel/recruitments', icon: Briefcase, label: 'Rekrutmen', permission: 'manage_recruitments' },
       { href: '/panel/partners', icon: Handshake, label: 'Mitra', permission: 'manage_partners' },
    ]
  },
  {
    group: 'E-Office',
    icon: Building2,
    items: [
        { href: '/panel/documents', icon: BookCopy, label: 'Surat & Dokumen', permission: 'manage_documents'},
        { href: '/panel/projects', icon: KanbanSquare, label: 'Manajemen Proyek', permission: 'manage_projects' },
        { href: '/panel/whatsapp', icon: MessageCircle, label: 'Manajemen WhatsApp', permission: 'manage_whatsapp' },
    ]
  },
  {
    group: 'Manajemen Internal',
    icon: Users,
    items: [
      { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
      { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
      { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
    ],
  },
   {
    group: 'Pengaturan',
    icon: Settings,
    items: [
      { href: '/panel/settings', icon: Settings, label: 'Pengaturan Aplikasi', permission: 'manage_settings' },
    ],
  },
];


const MoreMenuSheet = () => {
    const { hasPermission } = useAuth();
    const pathname = usePathname();

    const getVisibleItems = (items: any[]) => items.filter(item => !item.permission || hasPermission(item.permission));
    
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
                    <div className="grid grid-cols-3 gap-4">
                        {groupedNavItems.map((group) => {
                            const visibleItems = getVisibleItems(group.items);
                            if (visibleItems.length === 0) return null;

                            // For groups with a single item, link the whole group card
                            if (visibleItems.length === 1) {
                                const item = visibleItems[0];
                                return (
                                    <Link key={group.group} href={item.href} className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-secondary/50 hover:bg-secondary">
                                        <group.icon className="h-6 w-6 text-primary" />
                                        <span className="font-medium text-xs">{item.label}</span>
                                    </Link>
                                )
                            }
                            
                            // For groups with multiple items, use a popover/sheet (or just link to the first item as a directory)
                            // For simplicity, we can link to the first item of the group
                            return (
                                <Link key={group.group} href={visibleItems[0].href} className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-secondary/50 hover:bg-secondary">
                                    <group.icon className="h-6 w-6 text-primary" />
                                    <span className="font-medium text-xs">{group.group}</span>
                                </Link>
                            )
                        })}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}


export default function PanelBottomNav() {
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
