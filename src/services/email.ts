
'use server';

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  // These credentials should be stored securely in environment variables
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465, // Use 465 for SSL
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.ZOHO_EMAIL_USER,
      pass: process.env.ZOHO_EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Garda Lestari Notifikasi" <${process.env.ZOHO_EMAIL_USER}>`,
    to: to,
    subject: subject,
    text: text,
    html: html || `<p>${text}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    // In a real app, you'd want more robust error logging here
    return { success: false, error: (error as Error).message };
  }
}
