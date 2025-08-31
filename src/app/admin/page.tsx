
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2, Users, Sprout, Calendar, Newspaper, Shield, FileText, UserCog, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const AdminDashboard = () => {
  const router = useRouter();

  const managementMenus = [
    { label: 'Blog', icon: Newspaper, action: () => router.push('/admin/blog') },
    { label: 'Anggota', icon: Users, action: () => router.push('/admin/members') },
    { label: 'Program', icon: Sprout, action: () => router.push('/admin/programs') },
    { label: 'Acara', icon: Calendar, action: () => router.push('/admin/events') },
    { label: 'Halaman', icon: FileText, action: () => {} },
    { label: 'Peran & Izin', icon: UserCog, action: () => {} },
    { label: 'Pengaturan', icon: Settings, action: () => router.push('/admin/settings') },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold">Panel Admin</h1>
        <p className="text-muted-foreground">Selamat datang di Panel Admin Garda Lestari.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Program</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
             <p className="text-xs text-muted-foreground">+2 dari tahun lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Acara</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
             <p className="text-xs text-muted-foreground">+5 acara akan datang</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Postingan Blog</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">2 draft belum dipublikasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Konten</CardTitle>
          <CardDescription>Pilih salah satu menu di bawah untuk mengelola konten terkait.</CardDescription>
        </CardHeader>
        <CardContent>
           <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-2">
              {managementMenus.map((menu) => (
                <Button key={menu.label} variant="outline" onClick={menu.action} className="shrink-0" disabled={!menu.action}>
                  <menu.icon className="mr-2 h-4 w-4" />
                  {menu.label}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      {/* Further admin content can be added here */}
    </div>
  );
};


export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Jika tidak ada user, arahkan ke halaman login
        router.push('/login');
      } else if (user.phoneNumber !== ADMIN_PHONE_NUMBER) {
        // Jika user bukan admin, arahkan ke halaman feed
        router.push('/feed');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.phoneNumber !== ADMIN_PHONE_NUMBER) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // Hanya render panel admin jika user adalah admin
  return (
    <MainLayout>
      <AdminDashboard />
    </MainLayout>
  );
}
