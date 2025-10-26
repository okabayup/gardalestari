import { redirect } from 'next/navigation';
import { getShortLink, incrementClickCount } from '@/app/actions/shortlinks';

/**
 * This is a dynamic server component that handles redirection for gamules.io shortlinks.
 * It fetches the long URL from Firestore and performs a server-side redirect.
 */
export default async function ShortLinkRedirectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    redirect('/slug-not-found');
  }

  try {
    const shortLink = await getShortLink(slug);
    
    if (shortLink && shortLink.longUrl) {
      // Don't await this, let it run in the background to avoid blocking the redirect.
      incrementClickCount(slug);
      
      // Perform a permanent redirect to the long URL.
      redirect(shortLink.longUrl);
    } else {
      // If no shortlink is found, redirect to a user-friendly "not found" page.
      redirect('/slug-not-found');
    }
  } catch (error) {
    console.error(`[Shortlink Error] Error redirecting for slug ${slug}:`, error);
    redirect('/slug-not-found');
  }
}
