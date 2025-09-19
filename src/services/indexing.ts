
'use server';
import { google } from 'googleapis';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SCOPES = ['https://www.googleapis.com/auth/indexing'];
const indexingLogsCollection = collection(db, 'indexingLogs');

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
    let logData: { [key: string]: any } = {
        url,
        type,
        requestTimestamp: serverTimestamp(),
    };

    try {
        const auth = await getGoogleAuth();
        const indexer = google.indexing({ version: 'v3', auth });

        const response = await indexer.urlNotifications.publish({
            requestBody: {
                url: url,
                type: type,
            },
        });
        
        logData.responseStatus = response.status;
        logData.responseBody = response.data;

        if (response.status === 200) {
            console.log(`Successfully notified Google about URL (${type}): ${url}`);
            await addDoc(indexingLogsCollection, logData);
            return { success: true, data: response.data };
        } else {
             const errorMsg = `Google API responded with status ${response.status}: ${response.statusText}`;
             console.error('Google Indexing API Error:', errorMsg, response.data);
             logData.error = errorMsg;
             await addDoc(indexingLogsCollection, logData);
             return { success: false, error: errorMsg };
        }

    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message || 'An unknown error occurred.';
        console.error('Error notifying Google Indexing API:', errorMessage);
        logData.responseStatus = error.response?.status || 500;
        logData.error = errorMessage;
        await addDoc(indexingLogsCollection, logData);
        return { success: false, error: errorMessage };
    }
}
