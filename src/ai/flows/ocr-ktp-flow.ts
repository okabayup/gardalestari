
'use server';
/**
 * @fileOverview A flow to perform OCR on a PDF document. This flow is for general
 * document text extraction and can be used for various purposes, including comparing
 * document contents for verification.
 * - readDocumentText: A function that extracts text from a PDF file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OcrInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});

const OcrOutputSchema = z.object({
  text: z.string().describe('The full text extracted from the PDF document.'),
});

export async function readDocumentText(input: z.infer<typeof OcrInputSchema>): Promise<z.infer<typeof OcrOutputSchema>> {
  return ocrFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentOcrPrompt',
  input: { schema: OcrInputSchema },
  output: { schema: OcrOutputSchema },
  prompt: `You are an expert OCR system for PDF documents.
Analyze the provided file and extract all text content precisely.

Document to analyze: {{media url=fileDataUri}}

Provide the output in the requested JSON format.`,
});

const ocrFlow = ai.defineFlow(
  {
    name: 'documentOcrFlow',
    inputSchema: OcrInputSchema,
    outputSchema: OcrOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Gagal mendapatkan hasil OCR dari model AI.');
    }
    return output;
  }
);
