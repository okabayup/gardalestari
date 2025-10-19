
import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import FirebaseAnalytics from '@/components/FirebaseAnalytics';
import { Suspense } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gardalestari.org';

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
      default: 'Tumbuh Bersama Bumi',
      template: '%s | Garda Lestari',
    },
    description: 'Garda Lestari adalah organisasi kepemudaan yang berfokus pada inovasi di sektor agro-maritim dan kehutanan untuk pembangunan berkelanjutan di Indonesia.',
    manifest: '/manifest.json',
    themeColor: '#347C45',
    icons: {
      icon: '/icon-bg-putih.png',
      shortcut: '/icon-bg-putih.png',
      apple: '/logo-bg-hijau.png',
    },
    openGraph: {
      title: 'Tumbuh Bersama Bumi',
      description: 'Inovasi pemuda untuk kelestarian agro-maritim dan kehutanan Indonesia.',
      url: BASE_URL,
      siteName: 'Garda Lestari',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Lanskap Pertanian Indonesia',
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Tumbuh Bersama Bumi',
      description: 'Inovasi pemuda untuk kelestarian agro-maritim dan kehutanan Indonesia.',
      images: ['/og-image.png'],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Garda Lestari',
    },
};


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
