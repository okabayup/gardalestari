
'use server';

import type { PageSpeedReport } from '@/lib/definitions';

/**
 * Fetches a PageSpeed Insights report for a given URL.
 * @param url The URL to analyze.
 * @returns A promise that resolves to the PageSpeed report.
 */
export async function getPageSpeedReport(url: string): Promise<PageSpeedReport> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_API_KEY; // A general API key can be used here
    if (!apiKey) {
        throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_API_KEY is not set for PageSpeed Insights.');
    }

    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&strategy=MOBILE`;

    try {
        const response = await fetch(endpoint, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`PageSpeed API responded with status ${response.status}: ${errorData.error.message}`);
        }
        const data = await response.json();
        return data as PageSpeedReport;
    } catch (error: any) {
        console.error('Error fetching PageSpeed Insights report:', error.message);
        throw new Error(`Failed to fetch PageSpeed data: ${error.message}`);
    }
}
