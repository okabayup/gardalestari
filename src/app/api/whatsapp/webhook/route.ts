import { NextRequest, NextResponse } from 'next/server';
import { generateWhatsAppReply } from '@/ai/flows/whatsapp-autoreply-flow';

const WEBHOOK_API_KEY = process.env.SATUCONNECT_WEBHOOK_API_KEY;

/**
 * Webhook endpoint to receive events from a SatuConnect instance.
 * It logs incoming messages and triggers an AI auto-reply for text messages.
 *
 * @param {NextRequest} req The incoming request from SatuConnect.
 * @returns {NextResponse} A response indicating success or failure.
 */
export async function POST(req: NextRequest) {
  // --- Security Check ---
  const authHeader = req.headers.get('X-Api-Key');
  if (WEBHOOK_API_KEY && authHeader !== WEBHOOK_API_KEY) {
    console.warn('SatuConnect webhook received an unauthorized request.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    console.log('SatuConnect webhook received payload:', JSON.stringify(payload, null, 2));

    const { type, sender, message } = payload;

    // Handle different message types
    switch (type) {
      case 'text':
        console.log(`[Text Message] From: ${sender} | Message: "${message}"`);
        // Trigger the AI auto-reply flow, but don't wait for it to complete.
        // This ensures we can respond to the webhook quickly.
        generateWhatsAppReply({ sender, message }).catch(err => {
            console.error(`Error processing AI auto-reply for ${sender}:`, err);
        });
        break;
      case 'image':
        console.log(`[Image Message] From: ${sender} | Caption: "${payload.message}"`);
        break;
      case 'document':
        console.log(`[Document Message] From: ${sender} | Filename: "${payload.filename}"`);
        break;
      case 'audio':
        console.log(`[Audio Message] From: ${sender}`);
        break;
      case 'location':
        console.log(`[Location Message] From: ${sender} | Lat: ${payload.latitude}, Lon: ${payload.longitude}`);
        break;
      case 'contact':
        console.log(`[Contact Message] From: ${sender} | VCard: ${payload.vcard}`);
        break;
      default:
        console.log(`Received unhandled message type: '${type}' from ${sender}`);
        break;
    }

    // Respond immediately to acknowledge receipt of the webhook
    return NextResponse.json({ success: true, message: 'Webhook received and processing initiated' });

  } catch (error) {
    console.error('Error processing SatuConnect webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
