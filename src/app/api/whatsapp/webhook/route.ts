
import { NextRequest, NextResponse } from 'next/server';
import { generateWhatsAppReply } from '@/ai/flows/whatsapp-autoreply-flow';

export async function POST(req: NextRequest) {
  const WEBHOOK_API_KEY = process.env.SATUCONNECT_WEBHOOK_API_KEY;

  const authHeader = req.headers.get('X-Api-Key');
  if (WEBHOOK_API_KEY && authHeader !== WEBHOOK_API_KEY) {
    console.warn('SatuConnect webhook received an unauthorized request.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    console.log('SatuConnect webhook received payload:', JSON.stringify(payload, null, 2));

    const { type, sender, message } = payload;

    if (type === 'text') {
        console.log(`[Text Message] From: ${sender} | Message: "${message}"`);
        // Do not await this. Respond quickly to the webhook.
        generateWhatsAppReply({ sender, message }).catch(err => {
            console.error(`Error processing AI auto-reply for ${sender}:`, err);
        });
    }

    return NextResponse.json({ success: true, message: 'Webhook received and processing initiated' });

  } catch (error) {
    console.error('Error processing SatuConnect webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
