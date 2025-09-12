
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
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import type { PermissionId } from '@/lib/definitions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


const mainNavItems = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/berita', icon: Newspaper, label: 'Berita', permission: 'manage_news' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
    { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users' },
];

const groupedNavItems: {
  group: string;
  icon: React.ElementType;
  items: { href: string; icon: React.ElementType; label: string, permission?: PermissionId }[];
}[] = [
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

    const defaultAccordionValue = groupedNavItems.find(group => 
        getVisibleItems(group.items).some(item => pathname.startsWith(item.href))
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
                        {groupedNavItems.map((group) => {
                            const visibleItems = getVisibleItems(group.items);
                            if (visibleItems.length === 0) return null;

                            return (
                                <AccordionItem key={group.group} value={group.group}>
                                    <AccordionTrigger>{group.group}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-1">
                                            {visibleItems.map(item => (
                                                 <Link key={item.label} href={item.href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary">
                                                    <item.icon className="h-5 w-5 text-primary" />
                                                    <span className="font-medium text-sm text-foreground">{item.label}</span>
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


export default function PanelBottomNav() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  
  if (!user || !user.permissions || user.permissions.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 z-40 h-16 w-full border-t bg-background/95 backdrop-blur-lg md:hidden">
      <nav className="grid h-full grid-cols-5 items-center">
        {mainNavItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return <div key={item.href} />;
            }
            const isActive = pathname.startsWith(item.href);
            return (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 p-1 text-sm transition-colors hover:text-primary',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}
                >
                <item.icon className="h-5 w-5" />
                <span className="text-xs truncate">{item.label}</span>
                </Link>
          )})}
          <MoreMenuSheet />
      </nav>
    </div>
  );
}
