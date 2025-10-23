
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarInset } from '@/components/ui/sidebar';
import { redirect, usePathname } from 'next/navigation';
import { PanelSidebarContent } from '@/components/panel/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { PanelBadgesProvider } from '@/hooks/use-panel-badges';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

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
      <SidebarProvider defaultOpen={false}>
          <PanelBadgesProvider>
            <div className="grid h-full w-full md:grid-cols-[auto_1fr]">
                <Sidebar collapsible="icon" className="hidden md:block">
                    <PanelSidebarContent />
                </Sidebar>
                <SidebarInset>
                    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button size="icon" variant="outline" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0">
                                <PanelSidebarContent />
                            </SheetContent>
                        </Sheet>
                        <SidebarTrigger className="hidden md:flex" />
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                        {children}
                    </main>
                </SidebarInset>
            </div>
          </PanelBadgesProvider>
      </SidebarProvider>
  );
}
