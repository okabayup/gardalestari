
'use server';
/**
 * @fileOverview A flow to perform OCR on a KTP (Indonesian ID card).
 *
 * - readKtp - A function that extracts NIK and Name from a KTP image.
 * - KtpOcrInput - The input type for the readKtp function.
 * - KtpOcrOutput - The return type for the readKtp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const KtpOcrInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an Indonesian ID Card (KTP), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type KtpOcrInput = z.infer<typeof KtpOcrInputSchema>;

const KtpOcrOutputSchema = z.object({
  nik: z.string().describe('The NIK (Nomor Induk Kependudukan) extracted from the KTP.'),
  name: z.string().describe('The full name (Nama Lengkap) extracted from the KTP.'),
});
export type KtpOcrOutput = z.infer<typeof KtpOcrOutputSchema>;

export async function readKtp(input: KtpOcrInput): Promise<KtpOcrOutput> {
  return ktpOcrFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ktpOcrPrompt',
  input: { schema: KtpOcrInputSchema },
  output: { schema: KtpOcrOutputSchema },
  prompt: `You are an expert OCR system for Indonesian ID cards (KTP).
Analyze the provided image and extract the following fields precisely.
- NIK (Nomor Induk Kependudukan): It is a 16-digit number.
- Nama Lengkap (Full Name): Extract the full name exactly as written.

Image to analyze: {{media url=photoDataUri}}

Provide the output in the requested JSON format.`,
});

const ktpOcrFlow = ai.defineFlow(
  {
    name: 'ktpOcrFlow',
    inputSchema: KtpOcrInputSchema,
    outputSchema: KtpOcrOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Gagal mendapatkan hasil OCR dari model AI.');
    }
    return output;
  }
);
