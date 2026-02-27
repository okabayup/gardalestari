
'use client';

import { useEffect, Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import FirebaseAnalytics from '@/components/FirebaseAnalytics';
import { getAppSettings } from './actions/settings';
import { logError } from './actions/errors';
import { usePathname } from 'next/navigation';

function ErrorWatcher() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Don't log expected errors or errors during development that are already handled
      if (event.message.includes('Script error')) return;

      logError({
        context: 'client-runtime-error',
        message: event.message,
        stack: event.error?.stack,
        path: pathname,
        userId: user?.uid,
        userName: user?.displayName || undefined,
      }, !pathname.startsWith('/panel')); // Only alert dev if error is outside admin panel
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      logError({
        context: 'client-promise-rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        path: pathname,
        userId: user?.uid,
        userName: user?.displayName || undefined,
      }, !pathname.startsWith('/panel'));
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [user, pathname]);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ErrorWatcher />
          {children}
          <Toaster />
          <Suspense fallback={null}>
            <FirebaseAnalytics />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
