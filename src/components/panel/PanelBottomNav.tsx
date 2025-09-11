
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
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { PermissionId } from '@/lib/definitions';


const navItems: { href: string; icon: React.ElementType; label: string, permission?: PermissionId }[] = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
    { href: '/panel/announcements', icon: MegaphoneIcon, label: 'Pengumuman', permission: 'manage_announcements'},
    { href: '/panel/letters', icon: BookCopy, label: 'Surat', permission: 'manage_letters'},
    { href: '/panel/documents', icon: FolderArchive, label: 'Dokumen', permission: 'manage_documents'},
    { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
    { href: '/panel/recruitments', icon: Briefcase, label: 'Rekrutmen', permission: 'manage_recruitments' },
    { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
    { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
    { href: '/panel/berita', icon: Newspaper, label: 'Berita', permission: 'manage_news' },
    { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
    { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users' },
    { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
    { href: '/panel/partners', icon: Handshake, label: 'Mitra', permission: 'manage_partners' },
    { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
    { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', permission: 'manage_landing_page' },
    { href: '/panel/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
];

export default function PanelBottomNav() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  
  if (!user || !user.permissions || user.permissions.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 z-40 h-16 w-full border-t bg-background/95 backdrop-blur-lg md:hidden">
      <ScrollArea className="h-full w-full whitespace-nowrap">
        <nav className="flex h-full items-center justify-start px-2">
          {navItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }
            return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-full flex-col items-center justify-center gap-1 p-2 text-sm transition-colors hover:text-primary w-20',
                pathname.startsWith(item.href) ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs truncate">{item.label}</span>
            </Link>
          )})}
        </nav>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
