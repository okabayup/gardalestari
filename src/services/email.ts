
'use server';

import dotenv from 'dotenv';

dotenv.config();

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    const errorMsg = 'Konfigurasi Mailgun tidak lengkap di server.';
    console.error('[sendEmail Error]', errorMsg);
    return { success: false, error: errorMsg };
  }
  
  const endpoint = `https://api.mailgun.net/v3/${domain}/messages`;

  const formData = new FormData();
  formData.append('from', `"Garda Lestari Notifikasi" <notifikasi@${domain}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', text);
  if (html) {
    formData.append('html', html);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: formData,
    });
    
    const responseBody = await response.json();

    if (response.ok) {
      console.log(`Email sent successfully to ${to} via Mailgun:`, responseBody.message);
      return { success: true };
    } else {
      const errorMsg = responseBody.message || 'Unknown Mailgun API error';
      console.error(`Mailgun API error for ${to}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`Failed to send email to ${to} via Mailgun:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}
