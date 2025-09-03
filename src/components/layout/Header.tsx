
'use client';

import React from 'react';
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
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Shield, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const NotificationItem = ({ title, body, time, read }: { title: string, body: string, time: string, read: boolean }) => (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg">
        {!read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>}
        <div className="flex-1">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{body}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{time}</p>
        </div>
    </div>
);

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
  
  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center">
        <Link href="/feed" className="flex items-center">
          <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
               <Sheet>
                <SheetTrigger asChild>
                   <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {/* This is a placeholder for unread count */}
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-[10px]" variant="destructive">3</Badge>
                      <span className="sr-only">Notifikasi</span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Notifikasi</SheetTitle>
                    </SheetHeader>
                    <Separator />
                    <div className="-mx-6 flex-1 overflow-y-auto">
                      {/* Placeholder Notifications */}
                      <NotificationItem 
                        title="Program Baru: Beasiswa Lestari" 
                        body="Pendaftaran untuk program Beasiswa Lestari 2024 telah dibuka!" 
                        time="5 menit lalu"
                        read={false}
                      />
                       <NotificationItem 
                        title="Selamat Datang!" 
                        body="Selamat datang di aplikasi Garda Lestari. Jelajahi fitur dan mulailah berkontribusi." 
                        time="1 jam lalu"
                        read={false}
                      />
                       <NotificationItem 
                        title="Verifikasi Akun Anda" 
                        body="Jangan lupa untuk memverifikasi akun Anda untuk mendapatkan KTA digital." 
                        time="2 hari lalu"
                        read={false}
                      />
                       <NotificationItem 
                        title="Postingan Anda disukai" 
                        body="Pengguna 'anita_s' menyukai postingan Anda tentang hidroponik." 
                        time="3 hari lalu"
                        read={true}
                      />
                    </div>
                     <Button>Tandai semua sudah dibaca</Button>
                </SheetContent>
              </Sheet>

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
                  {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/panel/dashboard')} className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Panel Admin</span>
                      </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
