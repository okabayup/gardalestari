'use server';
import { google } from 'googleapis';
import { create, now } from '@/lib/db';

const COL_LOGS = 'indexingLogs';
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

type IndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED';

async function getGoogleAuth() {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Cloud service account credentials are not set in environment variables.');
    }
    return new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        SCOPES
    );
}

export async function notifyGoogleOfUpdate(url: string, type: IndexingNotificationType) {
    const logBase: Record<string, any> = { url, type, requestTimestamp: now() };

    try {
        const auth = await getGoogleAuth();
        const indexer = google.indexing({ version: 'v3', auth });

        const response = await indexer.urlNotifications.publish({
            requestBody: { url, type },
        });

        logBase.responseStatus = response.status;
        logBase.responseBody = response.data;

        if (response.status === 200) {
            console.log(`Successfully notified Google about URL (${type}): ${url}`);
            await create(COL_LOGS, logBase).catch(console.error);
            return { success: true, data: response.data };
        } else {
            const errorMsg = `Google API responded with status ${response.status}: ${response.statusText}`;
            console.error('Google Indexing API Error:', errorMsg);
            logBase.error = errorMsg;
            await create(COL_LOGS, logBase).catch(console.error);
            return { success: false, error: errorMsg };
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message || 'An unknown error occurred.';
        console.error('Error notifying Google Indexing API:', errorMessage);
        logBase.responseStatus = error.response?.status || 500;
        logBase.error = errorMessage;
        await create(COL_LOGS, logBase).catch(console.error);
        return { success: false, error: errorMessage };
    }
}
