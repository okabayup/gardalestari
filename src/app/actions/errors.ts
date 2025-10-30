
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { sendDevAlert } from '@/services/whatsapp';
import type { ErrorLog } from '@/lib/definitions';
import { sendEmail } from '@/services/email';

const errorLogsCollection = collection(db, 'errorLogs');
const ADMIN_ERROR_NOTIFICATION_EMAIL = 'okabayu2001@gmail.com';

/**
 * Logs an error to Firestore and optionally sends a notification to the developer.
 * @param errorData - The details of the error to log.
 * @param sendAlert - Whether to send a WhatsApp alert. Defaults to true.
 */
export async function logError(
  errorData: {
    message: string;
    stack?: string;
    context: string;
    userId?: string;
    userName?: string;
    userPhone?: string;
    path?: string;
  },
  sendAlert: boolean = true
) {
  try {
    // Log to Firestore
    await addDoc(errorLogsCollection, {
      ...errorData,
      timestamp: serverTimestamp(),
      resolved: false,
    });
    
    // Conditionally send alerts
    if (sendAlert) {
      const alertMessage = `🚨 *Garda App Error* 🚨\n\n*Context:* ${errorData.context}\n*User:* ${errorData.userName || 'N/A'} (${errorData.userPhone || errorData.userId || 'N/A'})\n*Path:* ${errorData.path || 'N/A'}\n*Error:* ${errorData.message}\n\n*Stack:* ${errorData.stack || 'No stack'}`;
      
      // Send WhatsApp Alert (fire-and-forget)
      sendDevAlert(alertMessage);

      // Send Email Alert (fire-and-forget)
      sendEmail({
        to: ADMIN_ERROR_NOTIFICATION_EMAIL,
        subject: `🚨 Garda App Error: ${errorData.context}`,
        text: alertMessage,
      }).catch(emailError => {
        console.error("CRITICAL: Failed to send error email alert.", emailError);
      });
    }
    
  } catch (loggingError) {
    console.error("CRITICAL: Failed to log error or send alert.", loggingError);
    // As a last resort, log to console
    console.error("Original Error:", errorData);
  }
}

/**
 * Fetches the most recent error logs from Firestore.
 * @returns A promise that resolves to an array of error log documents.
 */
export async function getErrorLogs(): Promise<ErrorLog[]> {
    try {
        const q = query(errorLogsCollection, orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure timestamp is serializable. Convert if it's a Firestore Timestamp.
            const timestamp = data.timestamp instanceof Timestamp 
                ? data.timestamp.toDate().toISOString() 
                : new Date().toISOString();
            return {
                id: doc.id,
                ...data,
                timestamp: timestamp
            } as unknown as ErrorLog;
        });
    } catch (error) {
        console.error("Failed to fetch error logs:", error);
        return [];
    }
}
