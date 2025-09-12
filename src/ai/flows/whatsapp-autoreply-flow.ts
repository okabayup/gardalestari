'use server';
/**
 * @fileOverview A flow to handle automated WhatsApp replies.
 *
 * - generateWhatsAppReply - A function that takes an incoming message and sender,
 *   generates a response, and sends it back.
 */

import { ai } from '@/ai/genkit';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { z } from 'zod';

const WhatsAppReplyInputSchema = z.object({
  sender: z.string().describe('The phone number of the person who sent the message.'),
  message: z.string().describe('The content of the incoming WhatsApp message.'),
});

// This flow doesn't need a specific output schema for the caller,
// as its main job is to trigger a side effect (sending a message).
const WhatsAppReplyOutputSchema = z.void();

const prompt = ai.definePrompt({
  name: 'whatsAppReplyPrompt',
  input: { schema: z.object({ message: z.string() }) },
  output: { schema: z.object({ reply: z.string() }) },
  prompt: `You are a friendly and helpful AI assistant for Garda Lestari, a youth-led environmental and agricultural organization in Indonesia.

Your task is to answer incoming WhatsApp messages concisely and accurately.

- If the user asks about Garda Lestari, explain that it is an organization for young people innovating in the agro-maritime and forestry sectors.
- If the user asks how to join, direct them to the registration page on the website: https://gardalestari.org/register
- If the user has a complex question or partnership inquiry, ask them to send an email to halo@gardalestari.org for a more detailed response.
- For all other general questions, answer helpfully based on the context of Garda Lestari.
- Always keep your answers brief, friendly, and in Bahasa Indonesia.

Incoming message:
"{{{message}}}"

Your reply:
`,
});

export const generateWhatsAppReply = ai.defineFlow(
  {
    name: 'generateWhatsAppReplyFlow',
    inputSchema: WhatsAppReplyInputSchema,
    outputSchema: WhatsAppReplyOutputSchema,
  },
  async ({ sender, message }) => {
    // 1. Generate the reply using the AI prompt.
    const { output } = await prompt({ message });

    if (!output || !output.reply) {
      console.error('AI failed to generate a reply for WhatsApp message.');
      return;
    }

    // 2. Send the generated reply back to the user.
    try {
      await sendWhatsAppMessage(sender, output.reply);
      console.log(`Successfully sent auto-reply to ${sender}`);
    } catch (error) {
      console.error(`Failed to send WhatsApp auto-reply to ${sender}:`, error);
    }
  }
);
