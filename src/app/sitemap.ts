
import { MetadataRoute } from 'next';
import { getBeritaPosts } from '@/app/actions/berita';
import { getPrograms } from '@/app/actions/programs';
import { getEvents } from '@/app/actions/events';

const BASE_URL = 'https://gardalestari.org'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Rute statis
  const staticRoutes = [
    '/', '/login', '/register', '/feed', '/members', '/programs', '/events',
    '/benefits', '/berita', '/video', '/profile', '/tentang', '/recruitments',
    '/evoting', '/map', '/kebijakan-privasi', '/hapus-data', '/ketentuan-layanan',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  // Rute dinamis untuk berita dan video
  const posts = await getBeritaPosts();
  const contentRoutes = posts.map((post) => ({
    url: `${BASE_URL}/${post.type === 'video' ? 'video' : 'berita'}/${post.slug}`,
    lastModified: new Date(post.date).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Rute dinamis untuk program
  const programs = await getPrograms();
  const programRoutes = programs.map((program) => ({
    url: `${BASE_URL}/programs/${program.id}`,
    lastModified: new Date(program.endDate).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Rute dinamis untuk acara
  const events = await getEvents();
  const eventRoutes = events.map((event) => ({
    url: `${BASE_URL}/events/${event.id}`,
    lastModified: new Date(event.date).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...contentRoutes, ...programRoutes, ...eventRoutes];
}
