
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';
import { PanelSidebarContent } from '@/components/panel/Sidebar';
import { PanelBadgesProvider } from '@/hooks/use-panel-badges';
import PanelHeader from '@/components/panel/PanelHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';


function MobileSidebar() {
    const { isMobile, openMobile, setOpenMobile } = useSidebar();
    if (!isMobile) return null;
    
    return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent side="left" className="w-3/4 p-0">
                 <PanelSidebarContent />
            </SheetContent>
        </Sheet>
    );
}

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
        <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <Sidebar collapsible="offcanvas" className="hidden border-r bg-muted/40 md:block">
              <PanelSidebarContent />
          </Sidebar>
           <MobileSidebar />
          <div className="flex flex-col">
            <PanelHeader />
            <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6">
                {children}
            </main>
          </div>
        </div>
      </PanelBadgesProvider>
    </SidebarProvider>
  );
}
