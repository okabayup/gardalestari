
'use client';

import { useEffect, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import FirebaseAnalytics from '@/components/FirebaseAnalytics';
import { logError } from './actions/errors';
import { usePathname } from 'next/navigation';
import FloatingContactButtons from '@/components/layout/FloatingContactButtons';

function ErrorWatcher() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message.includes('Script error')) return;

      logError({
        context: 'client-runtime-error',
        message: event.message,
        stack: event.error?.stack,
        path: pathname,
        userId: user?.uid,
        userName: user?.displayName || undefined,
      }, !pathname.startsWith('/panel'));
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

/**
 * ImageErrorWatcher: Monitoring global untuk mendeteksi kegagalan pemuatan gambar (404).
 * Hasil akan dicetak ke konsol browser dengan detail untuk membantu identifikasi masalah di server.
 */
function ImageErrorWatcher() {
  useEffect(() => {
    const handleImageError = (event: ErrorEvent) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        // Mencetak laporan error yang detail ke konsol untuk investigasi deploy
        console.group('🖼️ [Image Load Failure]');
        console.error('URL Sumber:', target.src);
        console.error('Alt Text:', target.alt || 'N/A');
        console.error('Lokasi Halaman:', window.location.pathname);
        console.error('Status: 404 Not Found atau Error Jaringan');
        console.log('Saran: Periksa apakah file ada di folder public/ dan penamaannya (case-sensitive).');
        console.groupEnd();
      }
    };

    // Menggunakan capture phase (true) karena event error pada tag img tidak melakukan bubbling
    window.addEventListener('error', handleImageError, true);
    return () => window.removeEventListener('error', handleImageError, true);
  }, []);

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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <title>Garda Lestari - Inovasi Pemuda Agro-Maritim & Kehutanan</title>
        <meta name="description" content="Wadah inovasi pemuda Indonesia di sektor agro-maritim dan kehutanan nusantara melalui teknologi dan pemberdayaan komunitas." />
        <meta name="keywords" content="agro-maritim, kehutanan, inovasi pemuda, pelestarian alam, garda lestari, indonesia hijau, banyuwangi" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ErrorWatcher />
          <ImageErrorWatcher />
          {children}
          <Toaster />
          <FloatingContactButtons />
          <Suspense fallback={null}>
            <FirebaseAnalytics />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
