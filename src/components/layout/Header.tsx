'use client';

import React, { useState, useEffect } from 'react';
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
import { LogOut, UserCircle, Shield, Bell, Loader2, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { getNotificationsForUser, markNotificationsAsRead, getUnreadNotificationsCount } from '@/app/actions/notifications';
import { getAppSettings, AppSettings } from '@/app/actions/settings';
import { formatDistanceToNow } from 'date-fns';
import { GlobalSearch } from '../search/GlobalSearch';
import { AppNotification } from '@/lib/definitions';

const NotificationItem = ({ title, body, time, read, link }: { title: string, body: string, time: string, read: boolean, link?: string }) => (
    <Link href={link || '#'} className="block p-3 hover:bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
            {!read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>}
            <div className="flex-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{body}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{time}</p>
            </div>
        </div>
    </Link>
);

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const isAdmin = user?.permissions && user.permissions.length > 0;
  
  useEffect(() => {
    setMounted(true);
    getAppSettings().then(setSettings);
  }, []);
  
  useEffect(() => {
    if (user && mounted) {
      const fetchCount = async () => {
        try {
            const count = await getUnreadNotificationsCount(user.uid);
            setUnreadCount(count);
        } catch (e) {
            console.error(e);
        }
      };
      fetchCount();
      
      const interval = setInterval(fetchCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user, mounted]);

  const handleOpenSheet = async () => {
    setIsSheetOpen(true);
    if (!user) return;
    
    setLoadingNotifications(true);
    try {
        const fetchedNotifications = await getNotificationsForUser(user.uid);
        setNotifications(fetchedNotifications);
        setUnreadCount(0);
        
        const unreadIds = fetchedNotifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            await markNotificationsAsRead(user.uid, unreadIds.filter((id): id is string => !!id));
        }
    } catch (error) {
        console.error("Failed to fetch notifications", error);
    } finally {
        setLoadingNotifications(false);
    }
  }

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

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-6 flex h-14 items-center">
          <Link href="/feed" className="flex items-center">
            <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" priority />
          </Link>
        </div>
      </header>
    );
  }
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-6 flex h-14 items-center">
        <Link href="/feed" className="flex items-center">
          <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" priority />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
               <GlobalSearch />
                {isAdmin && (
                  <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                    <Link href="/panel/dashboard"><Shield className="mr-2 h-4 w-4" /> Panel Admin</Link>
                  </Button>
                )}
               <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                   <Button variant="ghost" size="icon" className="relative" onClick={handleOpenSheet}>
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-[10px]" variant="destructive">{unreadCount > 9 ? '9+' : unreadCount}</Badge>
                      )}
                      <span className="sr-only">Notifikasi</span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Notifikasi</SheetTitle>
                    </SheetHeader>
                    <Separator />
                    <div className="-mx-6 flex-1 overflow-y-auto">
                      {loadingNotifications ? (
                          <div className="flex justify-center items-center h-full">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                      ) : notifications.length > 0 ? (
                          notifications.map(notif => (
                             <NotificationItemWrapper key={notif.id} notification={notif} />
                          ))
                      ) : (
                          <div className="text-center text-muted-foreground p-10">
                              <p>Tidak ada notifikasi baru.</p>
                          </div>
                      )}
                    </div>
                </SheetContent>
              </Sheet>

              {settings?.isPointsEnabled && (
                <Button variant="secondary" size="sm" className="h-8 gap-2" asChild>
                    <Link href="/points">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-bold">{user.greenPoints || 0}</span>
                    </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>@{user.username || user.displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile/me')} className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                  </DropdownMenuItem>
                   {settings?.isPointsEnabled && (
                      <DropdownMenuItem onClick={() => router.push('/points')} className="cursor-pointer flex justify-between items-center">
                        <div className="flex items-center">
                          <Coins className="mr-2 h-4 w-4" />
                          <span>Poin Hijau</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/panel/dashboard')} className="cursor-pointer sm:hidden">
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

function NotificationItemWrapper({ notification }: { notification: AppNotification }) {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const formatTime = async () => {
            const { id: localeId } = await import('date-fns/locale/id');
            const date = new Date(notification.createdAt as string);
            setTimeAgo(formatDistanceToNow(date, { addSuffix: true, locale: localeId }));
        };
        formatTime();
    }, [notification.createdAt]);

    return (
        <NotificationItem
            title={notification.title}
            body={notification.body}
            time={timeAgo}
            read={notification.read}
            link={notification.link}
        />
    );
}
