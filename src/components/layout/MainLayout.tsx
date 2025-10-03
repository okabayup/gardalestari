
'use client';

import { useRequireAuth } from '@/hooks/use-require-auth';
import Header from './Header';
import BottomNav from './BottomNav';
import { Loader2 } from 'lucide-react';
import InstallPWA from './InstallPWA';
import { useFcm } from '@/hooks/use-fcm';
import { usePathname } from 'next/navigation';
import VerificationFlow from '@/components/auth/VerificationFlow';
import WhatsAppVerificationDialog from '@/components/whatsapp/WhatsAppVerificationDialog';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();
  const pathname = usePathname();
  useFcm(); // Initialize FCM and request permission

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is unverified, force them into the verification flow.
  if (user.verificationStatus === 'unverified') {
    return <VerificationFlow />;
  }

  // If user is verified but WA number is not, show the dialog.
  const showWaVerification = user.verificationStatus !== 'unverified' && !user.waVerified;
  
  const isMapPage = pathname === '/map';
  const isAssistantPage = pathname === '/assistant';
  const showHeader = !isMapPage;
  const showBottomNav = !isMapPage;
  
  return (
    <div className="relative mx-auto flex h-screen w-full max-w-lg flex-col bg-background">
        <>
          {showHeader && <Header />}
          <main className="flex-1 overflow-auto">{children}</main>
          {showBottomNav && (
            <>
              <BottomNav />
              <InstallPWA />
            </>
          )}
          {showWaVerification && <WhatsAppVerificationDialog user={user} />}
        </>
    </div>
  );
}
