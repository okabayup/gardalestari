
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

const BOT_STATE_REF = doc(db, 'whatsappBot', 'state');
const API_KEY = process.env.WAHA_WEBHOOK_API_KEY;

/**
 * Webhook endpoint to receive events from a WAHA (WhatsApp HTTP API) instance.
 * It updates the bot's status and QR code in Firestore based on incoming events.
 *
 * @param {NextRequest} req The incoming request from WAHA.
 * @returns {NextResponse} A response indicating success or failure.
 */
export async function POST(req: NextRequest) {
  // --- Security Check ---
  const authHeader = req.headers.get('X-Api-Key');
  if (API_KEY && authHeader !== API_KEY) {
    console.warn('Webhook received an unauthorized request.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    console.log('Webhook received event:', payload.event);

    switch (payload.event) {
      // Session Management
      case 'session.status':
        await setDoc(BOT_STATE_REF, { 
            status: mapWahaStatus(payload.payload.name),
            lastUpdated: Date.now() 
        }, { merge: true });
        break;

      case 'session.qr':
        await setDoc(BOT_STATE_REF, {
          status: 'NEEDS_QR',
          qr: payload.payload.qr,
          lastUpdated: Date.now(),
        }, { merge: true });
        break;
      
      // Message Events
      case 'message':
      case 'message.any':
        console.log('Received message:', payload.payload.body);
        // Placeholder for future message handling logic
        break;
      
      case 'message.reaction':
        console.log('Received reaction:', payload.payload);
        break;
      
      case 'message.ack':
        console.log('Message ACK update:', payload.payload);
        break;
        
      case 'message.revoked':
        console.log('Message revoked:', payload.payload);
        break;
        
      case 'message.edited':
        console.log('Message edited:', payload.payload);
        break;

      // Group & Chat Events
      case 'group.join':
      case 'group.v2.join':
      case 'group.leave':
      case 'group.v2.leave':
      case 'group.v2.update':
      case 'group.v2.participants':
        console.log('Group event:', payload.event, payload.payload);
        break;
        
      case 'chat.archive':
        console.log('Chat archive status changed:', payload.payload);
        break;

      // Other Events
      case 'presence.update':
        // This can be very noisy, so log only if needed for debugging
        // console.log('Presence update:', payload.payload);
        break;

      case 'poll.vote':
      case 'poll.vote.failed':
        console.log('Poll event:', payload.event, payload.payload);
        break;
        
      case 'call.received':
      case 'call.accepted':
      case 'call.rejected':
        console.log('Call event:', payload.event, payload.payload);
        break;

      case 'label.upsert':
      case 'label.deleted':
      case 'label.chat.added':
      case 'label.chat.deleted':
        console.log('Label event:', payload.event, payload.payload);
        break;
        
      case 'message.waiting':
      case 'event.response':
      case 'event.response.failed':
      case 'engine.event':
        // Generic log for other events
        console.log(`Event '${payload.event}' received.`, payload.payload);
        break;
        
      default:
        console.log(`Unhandled event type: '${payload.event}'`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Maps the status strings from WAHA to the status strings used in the application.
 * @param wahaStatus The status string from WAHA (e.g., 'connecting', 'online').
 * @returns The corresponding application status string.
 */
function mapWahaStatus(wahaStatus: string): 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' {
    switch (wahaStatus.toLowerCase()) {
        case 'connecting':
            return 'CONNECTING';
        case 'online':
        case 'connected':
            return 'CONNECTED';
        case 'offline':
        case 'disconnected':
        default:
            return 'DISCONNECTED';
    }
}
