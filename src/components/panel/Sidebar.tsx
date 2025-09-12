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
  Presentation,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import type { PermissionId } from '@/lib/definitions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';


const navGroups: {
  group?: string;
  icon?: React.ElementType;
  items: { href: string; icon: React.ElementType; label: string; permission?: PermissionId }[];
}[] = [
  {
    items: [{ href: '/panel/dashboard', icon: Home, label: 'Dasbor' }],
  },
  {
    group: 'Publikasi',
    icon: Presentation,
    items: [
      { href: '/panel/berita', icon: Newspaper, label: 'Berita', permission: 'manage_news' },
      { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
      { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', permission: 'manage_landing_page' },
    ],
  },
  {
    group: 'Keterlibatan Anggota',
    icon: Lightbulb,
    items: [
      { href: '/panel/announcements', icon: Megaphone, label: 'Pengumuman', permission: 'manage_announcements'},
      { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
      { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
      { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
    ]
  },
   {
    group: 'Program & Peluang',
    icon: Briefcase,
    items: [
       { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
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
      { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users' },
      { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
      { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
      { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
    ],
  },
   {
    items: [
      { href: '/panel/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
    ],
  },
];


export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, hasPermission } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  if (!user || !user.permissions || user.permissions.length === 0) return null;


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
            {navGroups.map((group, index) => {
              const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission));
              if (visibleItems.length === 0) return null;

              if (!group.group) {
                const item = visibleItems[0];
                const isActive = pathname.startsWith(item.href);
                 return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                            isActive && 'bg-muted text-primary'
                        )}
                        >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
              }
              
              const isGroupActive = visibleItems.some(item => pathname.startsWith(item.href));

              return (
                 <Collapsible key={index} defaultOpen={isGroupActive}>
                    <CollapsibleTrigger className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary', isGroupActive && 'bg-muted text-primary' )}>
                        {group.icon && <group.icon className="h-4 w-4" />}
                        <span className="flex-1 text-left">{group.group}</span>
                        <ChevronRight className={cn("h-4 w-4 transition-transform", isGroupActive && "rotate-90")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-7 pt-1 space-y-1">
                        {visibleItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-xs',
                                        isActive && 'bg-muted/50 text-primary'
                                    )}
                                >
                                    <item.icon className="h-3 w-3" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </CollapsibleContent>
                 </Collapsible>
              )
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
            <Button size="sm" className="w-full" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
            </Button>
        </div>
      </div>
    </div>
  );
}
