
'use server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/indexing'];

// Type for the notification sent to Google Indexing API
type IndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED';

async function getGoogleAuth() {
    // Ensure environment variables are set
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Cloud service account credentials are not set in environment variables.');
    }
    
    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Replace escaped newlines with actual newlines for the private key
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    
    const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        SCOPES
    );
    return auth;
}

/**
 * Notifies the Google Indexing API of a URL update or deletion.
 * @param url The full URL to notify Google about.
 * @param type The type of notification, either 'URL_UPDATED' or 'URL_DELETED'.
 * @returns An object indicating success or failure.
 */
export async function notifyGoogleOfUpdate(url: string, type: IndexingNotificationType) {
    try {
        const auth = await getGoogleAuth();
        const indexer = google.indexing({ version: 'v3', auth });

        const response = await indexer.urlNotifications.publish({
            requestBody: {
                url: url,
                type: type,
            },
        });
        
        if (response.status === 200) {
            console.log(`Successfully notified Google about URL (${type}): ${url}`);
            return { success: true };
        } else {
             console.error('Google Indexing API responded with status:', response.status, response.statusText);
             return { success: false, error: `Google API responded with status ${response.status}` };
        }

    } catch (error: any) {
        console.error('Error notifying Google Indexing API:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.error?.message || error.message };
    }
}
