
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/panel/Sidebar';
import { redirect, usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, hasPermission } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user.permissions || user.permissions.length === 0) {
    redirect('/feed');
  }

  // Instead of replacing the entire layout, we render the panel content
  // inside the MainLayout. The MainLayout provides the main Header and BottomNav.
  return (
    <MainLayout>
        <div className="grid h-full w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col h-full">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                    {children}
                </main>
            </div>
            {/* PanelBottomNav is removed from here as MainLayout already provides a bottom nav */}
        </div>
    </MainLayout>
  );
}
