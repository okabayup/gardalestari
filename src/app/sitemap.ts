import { MetadataRoute } from 'next';
import { getBeritaPosts } from '@/app/actions/berita';

const BASE_URL = 'https://gardalestari.org'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Rute statis
  const staticRoutes = [
    '/',
    '/login',
    '/register',
    '/feed',
    '/members',
    '/programs',
    '/events',
    '/benefits',
    '/berita',
    '/profile',
    '/admin',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  // Rute dinamis untuk postingan berita
  const posts = await getBeritaPosts();
  const beritaPostRoutes = posts.map((post) => ({
    url: `${BASE_URL}/berita/${post.slug}`,
    lastModified: new Date().toISOString(), // Idealnya, ini harus menjadi tanggal update postingan
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...beritaPostRoutes];
}
