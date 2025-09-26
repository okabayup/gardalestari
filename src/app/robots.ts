import { MetadataRoute } from 'next'
 
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = 'https://gardalestari.org';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/panel/', '/profile/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
