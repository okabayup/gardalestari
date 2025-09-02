
'use client';

import { useRequireAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/panel/Sidebar';
import { redirect } from 'next/navigation';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth('/login');

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // A simple check for access. Can be expanded with roles.
  // if (!user.isAdmin) {
  //   redirect('/feed');
  // }


  return (
    <div className="flex min-h-screen bg-muted/40">
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
             <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
                 {children}
            </main>
        </div>
    </div>
  );
}
