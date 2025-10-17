
import { MetadataRoute } from 'next';
import { getBeritaPosts } from '@/app/actions/berita';
import { getPrograms } from '@/app/actions/programs';
import { getEvents } from '@/app/actions/events';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gardalestari.org'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public routes
  const staticRoutes = [
    '/',
    '/berita',
    '/video',
    '/tentang',
    '/programs',
    '/events',
    '/recruitments',
    '/documents',
    '/announcements',
    '/kebijakan-privasi',
    '/ketentuan-layanan',
    '/hapus-data',
    '/login',
    '/register'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  // Dynamic routes for blog posts and videos
  const posts = await getBeritaPosts();
  const contentRoutes = posts.map((post) => ({
    url: `${BASE_URL}/${post.type === 'video' ? 'video' : 'berita'}/${post.slug}`,
    lastModified: new Date(post.date).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Dynamic routes for programs
  const programs = await getPrograms();
  const programRoutes = programs.map((program) => ({
    url: `${BASE_URL}/programs/${program.id}`,
    lastModified: new Date(program.endDate || program.startDate).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic routes for events
  const events = await getEvents();
  const eventRoutes = events.map((event) => ({
    url: `${BASE_URL}/events/${event.id}`,
    lastModified: new Date(event.startDate).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Note: Internal routes like /feed, /profile, /panel/* etc. are intentionally excluded
  // as they should not be indexed by search engines.

  return [...staticRoutes, ...contentRoutes, ...programRoutes, ...eventRoutes];
}
