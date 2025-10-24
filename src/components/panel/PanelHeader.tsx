
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { GlobalSearch } from '../search/GlobalSearch';
import { User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home } from 'lucide-react';

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'GL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

export default function PanelHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch />
        <Button asChild variant="outline" size="icon">
          <Link href="/">
              <Home className="h-4 w-4" />
          </Link>
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                        <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile/me">Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/feed">Kembali ke Beranda</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Keluar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
