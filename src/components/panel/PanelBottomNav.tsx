
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
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Separator } from '../ui/separator';
import type { PermissionId } from '@/lib/definitions';


const mainNavItems = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/berita', icon: Newspaper, label: 'Berita', permission: 'manage_news' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
    { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users' },
];

const allNavItems: { href: string; icon: React.ElementType; label: string, permission?: PermissionId }[] = [
    { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
    { href: '/panel/announcements', icon: MegaphoneIcon, label: 'Pengumuman', permission: 'manage_announcements'},
    { href: '/panel/documents', icon: BookCopy, label: 'Surat & Dokumen', permission: 'manage_documents'},
    { href: '/panel/projects', icon: KanbanSquare, label: 'Proyek', permission: 'manage_projects' },
    { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
    { href: '/panel/recruitments', icon: Briefcase, label: 'Rekrutmen', permission: 'manage_recruitments' },
    { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
    { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
    { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
    { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
    { href: '/panel/partners', icon: Handshake, label: 'Mitra', permission: 'manage_partners' },
    { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
    { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', permission: 'manage_landing_page' },
    { href: '/panel/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
];


const MoreMenuSheet = () => {
    const { hasPermission } = useAuth();
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
                        {allNavItems.map(item => {
                            if (item.permission && !hasPermission(item.permission)) return null;
                            return (
                                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 hover:bg-secondary">
                                    <item.icon className="h-6 w-6 text-primary" />
                                    <span className="font-medium text-xs text-center">{item.label}</span>
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
