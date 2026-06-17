
'use server';
/**
 * @fileOverview A flow to convert text to speech using a high-quality voice.
 *
 * - textToSpeech - A function that takes a text string and returns a data URI for an audio file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const TextToSpeechInputSchema = z.string().describe('The text to be converted to speech.');
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
    audioDataUri: z.string().describe("The generated speech as a data URI in WAV format. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

// Helper to convert raw PCM buffer to WAV Base64 data
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000, // Gemini TTS sample rate
      bitDepth: 16,
    });

    const buffers: any[] = [];
    writer.on('data', chunk => buffers.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
    writer.on('error', reject);

    writer.end(pcmData);
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (text) => {
    // Generate the audio using Gemini TTS model
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A high-quality voice
          },
        },
      },
      prompt: text,
    });

    if (!media || !media.url) {
      throw new Error('Gagal menghasilkan audio dari model AI.');
    }

    // The model returns a data URI with raw PCM data, we need to convert it to WAV
    const pcmBase64 = media.url.substring(media.url.indexOf(',') + 1);
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    
    // Convert to WAV and create a new data URI
    const wavBase64 = await toWav(pcmBuffer);
    const audioDataUri = `data:audio/wav;base64,${wavBase64}`;

    return { audioDataUri };
  }
);


export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}
