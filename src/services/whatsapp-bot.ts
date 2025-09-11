
/**
 * IMPORTANT: This is a placeholder for a long-running WhatsApp bot service.
 * This code is NOT meant to be run directly in a serverless environment like Vercel.
 * You should run this file as a separate, persistent Node.js process on a server (e.g., a VPS or a container).
 * 
 * Example: `node -r ts-node/register src/services/whatsapp-bot.ts`
 * 
 * This file uses a simple in-memory object (`botState`) to store status, which is NOT scalable.
 * In a real-world scenario, you would use a database like Firestore or Redis to store
 * the bot's state (status, QR code, session files) so that your Next.js app can
 * read and write to it.
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';


type BotStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'NEEDS_QR';

interface BotState {
  status: BotStatus;
  qr: string | null;
  sock: any | null; // This will hold the socket instance
}

// In-memory state. In production, use Redis or Firestore.
let botState: BotState = {
  status: 'IDLE',
  qr: null,
  sock: null,
};


const stateRef = doc(db, 'whatsapp', 'botState');

async function updateState(updates: Partial<Omit<BotState, 'sock'>>) {
    botState = { ...botState, ...updates };
    // In a real implementation, you'd save this to a shared database (e.g., Firestore)
    try {
        await setDoc(stateRef, {
            status: botState.status,
            qr: botState.qr,
            updatedAt: new Date(),
        }, { merge: true });
    } catch (e) {
        console.error("Failed to update bot state in Firestore:", e);
    }
}


export async function startWhatsAppBot() {
  if (botState.sock) {
    console.log('Bot is already running or connecting.');
    return;
  }
  
  console.log('Starting WhatsApp bot...');
  await updateState({ status: 'CONNECTING', qr: null });

  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: process.env.NODE_ENV !== 'production', // Only print in terminal for dev
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  botState.sock = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR Code generated.');
      await updateState({ status: 'NEEDS_QR', qr });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      
      await updateState({ status: 'DISCONNECTED', qr: null, sock: null });
      botState.sock = null; // Clear the socket instance

      if (shouldReconnect) {
        // We don't auto-reconnect here to allow for manual control from the admin panel.
        // startWhatsAppBot();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened.');
      await updateState({ status: 'CONNECTED', qr: null });
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    // Placeholder for handling incoming messages
  });
}

export async function stopWhatsAppBot() {
  if (botState.sock) {
    console.log('Stopping WhatsApp bot...');
    await botState.sock.end(undefined);
    botState.sock = null;
    await updateState({ status: 'IDLE', qr: null });
  }
}

export async function logoutWhatsAppBot() {
    if (botState.sock) {
        console.log('Logging out WhatsApp bot...');
        await botState.sock.logout();
        botState.sock = null;
        await updateState({ status: 'IDLE', qr: null });
    }
}

export async function getWhatsAppBot() {
   // In a real implementation, you'd fetch this from a shared database (e.g., Firestore)
  try {
    const docSnap = await getDoc(stateRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            status: data.status as BotStatus,
            qr: data.qr as string | null
        }
    }
  } catch(e) {
     console.error("Failed to fetch bot state from Firestore:", e);
  }
  
  return {
    status: botState.status,
    qr: botState.qr,
  };
}

// A function to be called from your server actions to send messages
export async function sendMessage(to: string, text: string) {
    if (botState.status !== 'CONNECTED' || !botState.sock) {
        console.error('WhatsApp bot is not connected. Cannot send message.');
        throw new Error('WhatsApp bot is not connected.');
    }
    
    // Format number to WhatsApp JID
    const jid = to.endsWith('@s.whatsapp.net') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
        await botState.sock.sendMessage(jid, { text });
        console.log(`Message sent to ${jid}`);
        return { success: true };
    } catch(e) {
        console.error(`Failed to send message to ${jid}`, e);
        return { success: false, error: (e as Error).message };
    }
}
