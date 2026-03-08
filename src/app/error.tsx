'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { logError } from './actions/errors';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const ADMIN_CONTACT_WA = "https://wa.me/6285144904161?text=Halo%20Admin%2C%20saya%20mengalami%20error%20di%20aplikasi.";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPanel = pathname.startsWith('/panel');

  useEffect(() => {
    // Log the error to your error reporting service
    console.error("Global Error Boundary Caught:", error);
    logError({
      message: error.message,
      stack: error.stack,
      context: 'global-error-boundary',
      path: pathname,
      userId: user?.uid,
      userName: user?.displayName || undefined,
      userPhone: user?.phoneNumber || undefined,
    }, !isPanel); // Only send alert if it's not a panel error
  }, [error, pathname, user, isPanel]);


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <AlertTriangle className="h-24 w-24 text-destructive mb-6" />
      <h2 className="text-2xl font-semibold tracking-tight">Terjadi Kesalahan</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Maaf, terjadi kesalahan yang tidak terduga di pihak kami. Anda dapat mencoba lagi atau menghubungi dukungan jika masalah berlanjut.
      </p>
      <pre className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded-md max-w-md overflow-x-auto">
        {error.message || 'Error details not available.'}
      </pre>
      <div className="mt-8 flex gap-4">
        <Button onClick={() => reset()}>
          Coba Lagi
        </Button>
         <Button variant="outline" asChild>
          <Link href={ADMIN_CONTACT_WA} target="_blank">Hubungi Dukungan</Link>
        </Button>
      </div>
    </div>
  );
}