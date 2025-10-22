
import { notFound, redirect } from 'next/navigation';
import { getShortLink, incrementClickCount } from '@/app/actions/shortlinks';

// This is a dynamic server component that will be rendered on-demand.
export default async function ShortLinkRedirectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  try {
    const shortLink = await getShortLink(slug);
    
    if (shortLink && shortLink.longUrl) {
      // Don't await this, let it run in the background
      incrementClickCount(slug);
      // Redirect to the long URL
      redirect(shortLink.longUrl);
    } else {
      // If no shortlink is found, it might be a user profile or a post slug
      // We can redirect to a search page or a more specific route if needed,
      // but for now, we'll treat it as a 404.
      notFound();
    }
  } catch (error) {
    console.error(`Error redirecting for slug ${slug}:`, error);
    notFound();
  }
}
