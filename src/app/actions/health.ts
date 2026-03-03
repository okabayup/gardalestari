'use server';

/**
 * @fileOverview Server actions for checking site health and route accessibility.
 */

import { logError } from './errors';

/**
 * Scans all defined routes by performing a HEAD request to each.
 * Records results and logs errors if any route returns a non-OK status.
 */
export async function scanAllRoutes(): Promise<ScanResult[]> {
  // Routes to scan are defined locally to avoid exporting non-async functions from 'use server' file
  const routesToScan = [
    '/',
    '/berita',
    '/video',
    '/tentang',
    '/programs',
    '/events',
    '/recruitments',
    '/documents',
    '/announcements',
    '/points',
    '/ideas',
    '/evoting',
    '/panel/dashboard',
    '/panel/members',
    '/panel/finance/dashboard',
    '/panel/settings',
    '/profile/me',
  ];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  const results: ScanResult[] = [];

  for (const route of routesToScan) {
    try {
      const fullUrl = `${baseUrl}${route}`;
      const response = await fetch(fullUrl, { 
        method: 'HEAD',
        cache: 'no-store',
        headers: {
            'User-Agent': 'GardaHealthCheck/1.0'
        }
      });

      const result: ScanResult = {
        route,
        status: response.status,
        ok: response.ok,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        await logError({
          context: 'site-health-http-fail',
          message: `Route ${route} returned error status ${response.status}`,
          path: route,
        }, false);
      }

      results.push(result);
    } catch (error) {
      const errorMessage = (error as Error).message;
      results.push({
        route,
        status: 0,
        ok: false,
        error: errorMessage,
      });
      await logError({
        context: 'site-health-scan-error',
        message: `Failed to fetch route ${route}: ${errorMessage}`,
        path: route,
      }, false);
    }
  }

  return results;
}

export interface ScanResult {
  route: string;
  status: number;
  ok: boolean;
  error?: string;
}
