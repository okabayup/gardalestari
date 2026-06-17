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
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  // Fetch dynamic data for sitemap
  let contentRoutes: MetadataRoute.Sitemap = [];
  let programRoutes: MetadataRoute.Sitemap = [];
  let eventRoutes: MetadataRoute.Sitemap = [];

  try {
    const posts = await getBeritaPosts();
    contentRoutes = posts.map((post) => ({
      url: `${BASE_URL}/${post.type === 'video' ? 'video' : 'berita'}/${post.slug}`,
      lastModified: new Date(post.date).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) { console.error('Sitemap error: berita', e); }

  try {
    const programs = await getPrograms();
    programRoutes = programs.map((program) => ({
      url: `${BASE_URL}/programs/${program.id}`,
      lastModified: new Date(program.endDate || program.startDate).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) { console.error('Sitemap error: programs', e); }

  try {
    const events = await getEvents();
    eventRoutes = events.map((event) => ({
      url: `${BASE_URL}/events/${event.id}`,
      lastModified: new Date(event.startDate).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) { console.error('Sitemap error: events', e); }

  return [...staticRoutes, ...contentRoutes, ...programRoutes, ...eventRoutes];
}
