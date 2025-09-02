import { MetadataRoute } from 'next';
import { getBeritaPosts } from '@/app/actions/berita';
import { getPrograms } from '@/app/actions/programs';
import { getEvents } from '@/app/actions/events';

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
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Rute dinamis untuk program
  const programs = await getPrograms();
  const programRoutes = programs.map((program) => ({
    url: `${BASE_URL}/programs/${program.id}`,
    lastModified: program.endDate.toDate().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Rute dinamis untuk acara (jika ada halaman detail di masa depan)
  // Untuk saat ini, halaman /events sudah ada di rute statis.
  // Jika setiap acara punya halaman sendiri, kita bisa menambahkannya seperti ini:
  // const events = await getEvents();
  // const eventRoutes = events.map((event) => ({
  //   url: `${BASE_URL}/events/${event.id}`,
  //   lastModified: event.date.toDate().toISOString(),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  return [...staticRoutes, ...beritaPostRoutes, ...programRoutes];
}
