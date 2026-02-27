
'use server';

/**
 * @fileOverview Server actions for checking site health and route accessibility.
 */

import { logError } from './errors';

export const ROUTES_TO_SCAN = [
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

export interface ScanResult {
  route: string;
  status: number;
  ok: boolean;
  error?: string;
}

/**
 * Scans all defined routes by performing a HEAD request to each.
 * Records results and logs errors if any route returns a non-OK status.
 */
export async function scanAllRoutes(): Promise<ScanResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  const results: ScanResult[] = [];

  for (const route of ROUTES_TO_SCAN) {
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
          context: 'site-health-scan',
          message: `Route ${route} returned error status ${response.status}`,
          path: route,
        }, false); // Don't send WhatsApp alert for automated scan failures
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
        context: 'site-health-scan',
        message: `Failed to fetch route ${route}: ${errorMessage}`,
        path: route,
      }, false);
    }
  }

  return results;
}
