'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';
import { PanelSidebarContent } from '@/components/panel/Sidebar';
import { PanelBadgesProvider } from '@/hooks/use-panel-badges';
import PanelHeader from '@/components/panel/PanelHeader';
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
  
  if (!user.permissions || user.permissions.length === 0) {
    redirect('/feed');
  }

  return (
    <SidebarProvider>
      <PanelBadgesProvider>
        <div className="flex h-screen w-full bg-muted/40">
          <Sidebar collapsible="offcanvas" variant="sidebar" className="hidden md:flex">
              <PanelSidebarContent />
          </Sidebar>
          <div className="flex flex-1 flex-col">
            <PanelHeader />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                {children}
            </main>
          </div>
          <PanelBottomNav />
        </div>
      </PanelBadgesProvider>
    </SidebarProvider>
  );
}
