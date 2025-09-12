
'use server';
/**
 * @fileOverview A flow to handle automated WhatsApp replies.
 *
 * - generateWhatsAppReply - A function that takes an incoming message and sender,
 *   analyzes the intent, and performs the appropriate action (reply, fetch data, etc.).
 */

import { ai } from '@/ai/genkit';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { z } from 'zod';
import { getDocument } from '@/app/actions/documents';
import { getLatestProgramsText } from '@/app/actions/whatsapp';
import { createIdea } from '@/app/actions/ideas';
import { getUserByWaNumber } from '@/app/actions/user';

const WhatsAppReplyInputSchema = z.object({
  sender: z.string().describe('The phone number of the person who sent the message (e.g., 628123...).'),
  message: z.string().describe('The content of the incoming WhatsApp message.'),
});

const IntentSchema = z.object({
  intent: z.enum([
    'INFO_PROGRAM',
    'CEK_STATUS_DOKUMEN',
    'AJUKAN_IDE',
    'TANYA_UMUM',
    'TIDAK_DIKENALI',
  ]).describe('The identified user intent.'),
  nomorDokumen: z.string().optional().describe('The document number if the intent is CEK_STATUS_DOKUMEN.'),
  judulIde: z.string().optional().describe('The title of the idea if the intent is AJUKAN_IDE.'),
  deskripsiIde: z.string().optional().describe('The description of the idea if the intent is AJUKAN_IDE.'),
});


const prompt = ai.definePrompt({
  name: 'whatsAppIntentParser',
  input: { schema: z.object({ message: z.string() }) },
  output: { schema: IntentSchema },
  prompt: `You are an expert at understanding user intent from WhatsApp messages for an organization called Garda Lestari.
Analyze the message and determine the user's goal.

The possible intents are:
- INFO_PROGRAM: User is asking for information about open programs. Keywords: "info program", "program", "pendaftaran".
- CEK_STATUS_DOKUMEN: User wants to check the status of a document. They must provide a document number. Keywords: "status dokumen", "cek surat", "nomor surat".
- AJUKAN_IDE: User wants to submit a new idea. Keywords: "ide:", "ajukan ide", "usul". The format is usually "ide: [Judul Ide]. [Deskripsi Ide]".
- TANYA_UMUM: User is asking a general question about the organization, how to join, partnership, etc. This is the default if no other intent matches.
- TIDAK_DIKENALI: The message is unclear or cannot be processed.

If the intent is CEK_STATUS_DOKUMEN, extract the document number into 'nomorDokumen'. The number looks like "001/GL/S-KAT/I/2024".
If the intent is AJUKAN_IDE, extract the title into 'judulIde' and the description into 'deskripsiIde'.

Message: "{{{message}}}"
`,
});

const generalKnowledgePrompt = ai.definePrompt({
  name: 'whatsAppGeneralKnowledge',
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

export async function generateWhatsAppReply(input: z.infer<typeof WhatsAppReplyInputSchema>): Promise<void> {
  const { sender, message } = input;
  
  const { output: intentOutput } = await prompt({ message });
  if (!intentOutput) {
      console.error('AI failed to parse intent.');
      return;
  }
  
  let replyMessage = '';

  switch (intentOutput.intent) {
    case 'INFO_PROGRAM':
      replyMessage = await getLatestProgramsText();
      break;

    case 'CEK_STATUS_DOKUMEN':
      if (!intentOutput.nomorDokumen) {
        replyMessage = 'Mohon maaf, untuk mengecek status dokumen, silakan sebutkan nomor dokumennya. Contoh: "status dokumen 001/GL/S-KAT/I/2024"';
      } else {
        const doc = await getDocument(intentOutput.nomorDokumen);
        if (!doc) {
          replyMessage = `Dokumen dengan nomor ${intentOutput.nomorDokumen} tidak ditemukan.`;
        } else {
          replyMessage = `Status untuk dokumen "${doc.title}" adalah: *${doc.status}*.`;
        }
      }
      break;

    case 'AJUKAN_IDE':
      if (!intentOutput.judulIde || !intentOutput.deskripsiIde) {
         replyMessage = 'Format pengajuan ide tidak lengkap. Gunakan format: "ide: [Judul Ide]. [Deskripsi ide Anda]".';
      } else {
         const user = await getUserByWaNumber(sender);
         if (!user) {
             replyMessage = 'Anda harus menjadi anggota terverifikasi untuk mengajukan ide. Silakan daftar dan verifikasi akun Anda terlebih dahulu.';
         } else {
             await createIdea(user.id, intentOutput.judulIde, intentOutput.deskripsiIde, 'WhatsApp');
             replyMessage = `Terima kasih! Ide Anda "${intentOutput.judulIde}" telah berhasil diajukan dan akan segera ditinjau.`;
         }
      }
      break;
      
    case 'TANYA_UMUM':
       const { output: generalReply } = await generalKnowledgePrompt({ message });
       replyMessage = generalReply?.reply || 'Terima kasih atas pesan Anda. Tim kami akan segera merespons.';
      break;

    case 'TIDAK_DIKENALI':
    default:
      replyMessage = 'Terima kasih atas pesan Anda. Mohon maaf, saya tidak mengerti permintaan Anda. Anda bisa menanyakan info program, status dokumen, atau pertanyaan umum tentang Garda Lestari.';
      break;
  }
  
  try {
    await sendWhatsAppMessage(sender, replyMessage);
    console.log(`Successfully sent auto-reply to ${sender}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp auto-reply to ${sender}:`, error);
  }
}

ai.defineFlow(
  {
    name: 'generateWhatsAppReplyFlow',
    inputSchema: WhatsAppReplyInputSchema,
    outputSchema: z.void(),
  },
  generateWhatsAppReply
);
