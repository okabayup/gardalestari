
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getShortLink, incrementClickCount } from '@/app/actions/shortlinks';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

/**
 * This is a dynamic client component that handles redirection for gamules.io shortlinks.
 * It shows a loading state, fetches the long URL, and performs a client-side redirect.
 */
export default function ShortLinkRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      const handleRedirect = async () => {
        try {
          const shortLink = await getShortLink(slug);
          
          if (shortLink && shortLink.longUrl) {
            // Don't await this, let it run in the background to avoid blocking the redirect.
            incrementClickCount(slug);
            
            // Perform a client-side redirect.
            window.location.href = shortLink.longUrl;
          } else {
            // If no shortlink is found, redirect to a user-friendly "not found" page.
            router.replace('/slug-not-found');
          }
        } catch (error) {
          console.error(`[Shortlink Error] Error redirecting for slug ${slug}:`, error);
          router.replace('/slug-not-found');
        }
      };

      handleRedirect();
    }
  }, [slug, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <Image src="/logo.png" alt="Garda Lestari Logo" width={160} height={42} className="h-auto w-40 mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Mengarahkan tautan...</p>
    </div>
  );
}
