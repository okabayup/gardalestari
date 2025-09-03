
'use server';
/**
 * @fileOverview A flow to generate an image from a text prompt.
 *
 * - generateImage - A function that generates an image using Imagen 2.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: `A high-quality, professional photograph of: ${input.prompt}`,
    });

    const imageUrl = media.url;
    if (!imageUrl) {
      throw new Error('Failed to generate image. No URL returned from the model.');
    }
    
    return { imageUrl };
  }
);
