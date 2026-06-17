
'use server';

import { sendEmail as sendEmailService } from '@/services/email';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendTestEmail(payload: EmailPayload): Promise<{ success: boolean, error?: string }> {
  try {
    const result = await sendEmailService(payload);
    if (!result.success) {
      throw new Error(result.error || 'Unknown error from email service');
    }
    return { success: true };
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    console.error("[sendTestEmail Error]", errorMessage);
    throw new Error(errorMessage);
  }
}
