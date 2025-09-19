
'use server';

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { AnalyticsReport } from '@/lib/definitions';

async function getGoogleAuth() {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Cloud service account credentials are not set in environment variables.');
    }
    return {
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
    };
}

/**
 * Fetches a report from the Google Analytics Data API.
 * @param dimensions An array of dimension names.
 * @param metrics An array of metric names.
 * @param dateRanges An array of date ranges.
 * @returns A promise that resolves to the analytics report.
 */
export async function getAnalyticsReport(
    dimensions: { name: string }[],
    metrics: { name: string }[],
    dateRanges: { startDate: string; endDate: string }[]
): Promise<AnalyticsReport> {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
        throw new Error('GA4_PROPERTY_ID is not set in environment variables.');
    }

    try {
        const auth = await getGoogleAuth();
        const analyticsDataClient = new BetaAnalyticsDataClient(auth);

        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dimensions,
            metrics,
            dateRanges,
        });
        
        return {
            dimensionHeaders: response.dimensionHeaders || [],
            metricHeaders: response.metricHeaders || [],
            rows: response.rows || [],
        };

    } catch (error: any) {
        console.error('Error fetching Google Analytics report:', error.details || error.message);
        throw new Error(`Failed to fetch Analytics data: ${error.details || error.message}`);
    }
}
