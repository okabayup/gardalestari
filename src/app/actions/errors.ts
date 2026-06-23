'use client';

import { supabase } from '@/lib/supabase';
import { sendDevAlert } from '@/services/whatsapp';
import type { ErrorLog } from '@/lib/definitions';
import { sendEmail } from '@/services/email';

// Uses client-side Supabase (this is a 'use client' file)
const TABLE = 'firebase_garda_lestari_error_logs';
const ADMIN_ERROR_NOTIFICATION_EMAIL = 'okabayu2001@gmail.com';

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
    const _id = crypto.randomUUID();
    await supabase.from(TABLE).insert({
      _id,
      raw_data: { ...errorData, resolved: false, timestamp: new Date().toISOString() },
    });

    if (sendAlert) {
      const alertMessage = `🚨 *Garda App Error* 🚨\n\n*Context:* ${errorData.context}\n*User:* ${errorData.userName || 'N/A'} (${errorData.userPhone || errorData.userId || 'N/A'})\n*Path:* ${errorData.path || 'N/A'}\n*Error:* ${errorData.message}\n\n*Stack:* ${errorData.stack?.substring(0, 500) || 'No stack'}`;
      sendDevAlert(alertMessage);
      sendEmail({
        to: ADMIN_ERROR_NOTIFICATION_EMAIL,
        subject: `🚨 Garda App Error: ${errorData.context}`,
        text: alertMessage,
      }).catch(emailError => {
        console.error('CRITICAL: Failed to send error email alert.', emailError);
      });
    }
  } catch (loggingError) {
    console.error('CRITICAL: Failed to log error or send alert.', loggingError);
    console.error('Original Error:', errorData);
  }
}

export async function getErrorLogs(): Promise<ErrorLog[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('_id, raw_data')
      .order('raw_data->>timestamp', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map(r => ({ id: r._id, ...r.raw_data } as unknown as ErrorLog));
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    return [];
  }
}
