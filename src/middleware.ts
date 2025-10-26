'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getShortLink, incrementClickCount } from './app/actions/shortlinks';

// Define the domains
const APP_DOMAIN = process.env.NEXT_PUBLIC_BASE_URL?.replace(/https?:\/\//, '') || 'gardalestari.org';
const SHORTLINK_DOMAIN_HOST = 'gamules.io';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const pathname = request.nextUrl.pathname;

  // If the host is the shortlink domain, handle redirection
  if (host === SHORTLINK_DOMAIN_HOST) {
    const slug = pathname.substring(1); // Remove leading '/'
    
    // Ignore requests for static files or API routes on the shortlink domain
    if (!slug || slug.startsWith('_next') || slug.startsWith('api/')) {
        return NextResponse.next();
    }
    
    const shortLinkData = await getShortLink(slug);
    if (shortLinkData?.longUrl) {
        // Run analytics in the background
        await incrementClickCount(slug);
        // Redirect to the long URL
        return NextResponse.redirect(shortLinkData.longUrl);
    }
    
    // If slug is not found or is empty, redirect to a 'not found' page on the main app domain
    const notFoundUrl = new URL('/slug-not-found', `https://${APP_DOMAIN}`);
    return NextResponse.redirect(notFoundUrl);
  }

  // For all other domains (e.g., gardalestari.org), continue as normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
