
'use client';

import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import type { PermissionId } from '@/lib/definitions';


const navItems: { href: string; icon: React.ElementType; label: string, permission?: PermissionId }[] = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
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
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              return (
               <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    (pathname === item.href || (item.href !== '/panel/dashboard' && pathname.startsWith(item.href))) && 'bg-muted text-primary'
                )}
                >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
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
