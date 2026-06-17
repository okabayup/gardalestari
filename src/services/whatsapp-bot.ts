
/**
 * @fileoverview WhatsApp Bot service for Garda Lestari.
 */

import { generateWhatsAppReply } from '@/ai/flows/whatsapp-autoreply-flow';

/**
 * Processes an incoming message from the WhatsApp webhook.
 * @param sender The phone number of the sender.
 * @param message The message content.
 */
export async function processIncomingMessage(sender: string, message: string) {
  try {
    console.log(`[WhatsApp Bot Service] Processing message from ${sender}`);
    await generateWhatsAppReply({ sender, message });
  } catch (error) {
    console.error('[WhatsApp Bot Service Error]', error);
  }
}
