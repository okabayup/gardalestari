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
  BookOpen,
  AreaChart
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


const navGroups: {
  group?: string;
  icon?: React.ElementType;
  items: { href: string; icon: React.ElementType; label: string; permission?: PermissionId, badge?: keyof ReturnType<typeof usePanelBadges>['badges'] }[];
}[] = [
  {
    items: [{ href: '/panel/dashboard', icon: Home, label: 'Dasbor' }],
  },
  {
    group: 'Analitik',
    icon: TrendingUp,
    items: [
      { href: '/panel/performance', icon: TrendingUp, label: 'Performa', permission: 'manage_settings' },
      { href: '/panel/analytics/errors', icon: Bug, label: 'Log Error', permission: 'manage_settings' },
    ]
  },
   {
    group: 'Manajemen Keuangan',
    icon: Wallet,
    items: [
      { href: '/panel/finance/accounts', icon: BookCopy, label: 'Bagan Akun', permission: 'manage_finance' },
      { href: '/panel/finance/journal', icon: BookOpen, label: 'Jurnal Umum', permission: 'manage_finance' },
      { href: '/panel/finance/reports', icon: AreaChart, label: 'Laporan Keuangan', permission: 'manage_finance' },
    ]
  },
  {
    group: 'Publikasi',
    icon: Presentation,
    items: [
      { href: '/panel/berita', icon: Newspaper, label: 'Konten', permission: 'manage_news' },
      { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
      { href: '/panel/landing', icon: Landmark, label: 'Halaman Utama', permission: 'manage_landing_page' },
    ],
  },
  {
    group: 'Keterlibatan Anggota',
    icon: Lightbulb,
    items: [
      { href: '/panel/ideas', icon: Lightbulb, label: 'Lab Ide & Aksi', permission: 'manage_ideas'},
      { href: '/panel/announcements', icon: Megaphone, label: 'Pengumuman', permission: 'manage_announcements'},
      { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
      { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
      { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
      { href: '/panel/badges', icon: Award, label: 'Lencana', permission: 'manage_badges' },
    ],
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
    group: 'Poin Hijau',
    icon: Coins,
    items: [
       { href: '/panel/redeem', icon: Gift, label: 'Item Hadiah', permission: 'manage_settings' },
       { href: '/panel/missions', icon: Target, label: 'Misi', permission: 'manage_settings' },
       { href: '/panel/redeem/history', icon: BookCopy, label: 'Riwayat Penukaran', permission: 'manage_settings' },
    ]
  },
  {
    group: 'Persuratan',
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
      { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users', badge: 'pendingMembers' },
      { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
      { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
      { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
      { href: '/panel/map-datasets', icon: Layers, label: 'Dataset Peta', permission: 'manage_map_datasets' },
      { href: '/panel/data-bank', icon: Database, label: 'Bank Data', permission: 'manage_data_bank'},
      { href: '/panel/reports', icon: Flag, label: 'Laporan', permission: 'manage_reports' },
    ],
  },
   {
    items: [
      { href: '/panel/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
    ],
  },
];


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

  const defaultAccordionValue = navGroups.find(group => 
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
            <Accordion type="single" collapsible defaultValue={defaultAccordionValue} className="w-full">
                {navGroups.map((group, index) => {
                const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission as PermissionId));
                if (visibleItems.length === 0) return null;

                const renderNavItem = (item: (typeof visibleItems)[0]) => {
                    const isActive = pathname.startsWith(item.href);
                    const badgeCount = item.badge ? badges[item.badge] : 0;
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
                             {badgeCount > 0 && (
                                <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                    {badgeCount}
                                </Badge>
                            )}
                        </Link>
                    )
                }

                if (!group.group) {
                    return renderNavItem(visibleItems[0]);
                }
                
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
                                const badgeCount = item.badge ? badges[item.badge] : 0;
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
