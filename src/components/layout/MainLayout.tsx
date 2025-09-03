
'use client';

import { useRequireAuth } from '@/hooks/use-auth';
import Header from './Header';
import BottomNav from './BottomNav';
import { Loader2 } from 'lucide-react';
import InstallPWA from './InstallPWA';
import { useFcm } from '@/hooks/use-fcm';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();
  useFcm(); // Initialize FCM and request permission

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <InstallPWA />
    </div>
  );
}
