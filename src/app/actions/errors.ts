'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { sendDevAlert } from '@/services/whatsapp';
import type { ErrorLog } from '@/lib/definitions';


const errorLogsCollection = collection(db, 'errorLogs');

/**
 * Logs an error to Firestore and sends a notification to the developer.
 * @param errorData - The details of the error to log.
 */
export async function logError(errorData: {
  message: string;
  stack?: string;
  context: string;
  userId?: string;
}) {
  try {
    // Log to Firestore
    await addDoc(errorLogsCollection, {
      ...errorData,
      timestamp: serverTimestamp(),
      resolved: false,
    });
    
    // Send WhatsApp Alert
    const alertMessage = `Context: ${errorData.context}\nUser: ${errorData.userId || 'N/A'}\nError: ${errorData.message}`;
    await sendDevAlert(alertMessage);
    
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
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ErrorLog));
    } catch (error) {
        console.error("Failed to fetch error logs:", error);
        return [];
    }
}
