
'use client';

import { useAuth } from '@/hooks/use-auth';
import Header from './Header';
import LandingHeader from './LandingHeader';
import BottomNav from './BottomNav';
import { Loader2 } from 'lucide-react';
import InstallPWA from './InstallPWA';
import { useFcm } from '@/hooks/use-fcm';

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useFcm(); 

  const AppHeader = user ? Header : LandingHeader;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-20">{children}</main>
      {user && (
        <>
          <BottomNav />
          <InstallPWA />
        </>
      )}
    </div>
  );
}
