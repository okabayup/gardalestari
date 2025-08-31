
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'GL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center">
        <Link href="/feed" className="flex items-center">
          <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
        </Link>
        <div className="ml-auto">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>@{user.username || user.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => router.push('/profile/me')} className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profil Saya</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
