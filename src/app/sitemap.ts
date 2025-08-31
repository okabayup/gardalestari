import { MetadataRoute } from 'next';
import { getBlogPosts } from '@/app/actions/blog';

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
    '/blog',
    '/profile',
    '/admin',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  // Rute dinamis untuk postingan blog
  const posts = await getBlogPosts();
  const blogPostRoutes = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date().toISOString(), // Idealnya, ini harus menjadi tanggal update postingan
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogPostRoutes];
}
