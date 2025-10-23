
import { notFound, redirect } from 'next/navigation';
import { getShortLink, incrementClickCount } from '@/app/actions/shortlinks';

/**
 * This is a dynamic server component that handles redirection for gamules.io shortlinks.
 * It fetches the long URL from Firestore and performs a server-side redirect.
 */
export default async function ShortLinkRedirectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  try {
    const shortLink = await getShortLink(slug);
    
    if (shortLink && shortLink.longUrl) {
      // Don't await this, let it run in the background to avoid blocking the redirect.
      incrementClickCount(slug);
      
      // Perform a permanent redirect to the long URL.
      redirect(shortLink.longUrl);
    } else {
      // If no shortlink is found, it's a 404.
      notFound();
    }
  } catch (error) {
    console.error(`[gamules.io] Error redirecting for slug ${slug}:`, error);
    notFound();
  }
}
