
import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_API_KEY = process.env.SATUCONNECT_WEBHOOK_API_KEY;

/**
 * Webhook endpoint to receive events from a SatuConnect instance.
 * It logs incoming messages to the server console.
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
    console.log('SatuConnect webhook received payload:', payload);

    const { type, sender, message, timestamp } = payload;

    // You can build more logic here based on message type
    switch (type) {
      case 'text':
        console.log(`[Text Message] From: ${sender} | Message: "${message}"`);
        // Example: await handleTextMessage(sender, message);
        break;
      case 'image':
        console.log(`[Image Message] From: ${sender} | Caption: "${message}"`);
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

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing SatuConnect webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
