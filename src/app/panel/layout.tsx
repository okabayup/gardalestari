'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/panel/Sidebar';
import { redirect } from 'next/navigation';
import PanelBottomNav from '@/components/panel/PanelBottomNav';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // A simple check for access. If user has no permissions, they can't access the panel.
  if (!user.permissions || user.permissions.length === 0) {
    redirect('/feed');
  }


  return (
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
    <Sidebar />
    <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 sm:pb-4">
        {children}
        </main>
    </div>
    <PanelBottomNav />
    </div>
  );
}
