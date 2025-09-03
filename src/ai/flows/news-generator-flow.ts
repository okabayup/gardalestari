
'use server';
/**
 * @fileOverview A flow to generate a full news article from a topic and description.
 *
 * - generateNewsArticle - A function that generates a title, content with image placeholders, an excerpt, a category, and a cover image.
 * - NewsGeneratorInput - The input type for the generateNewsArticle function.
 * - NewsGeneratorOutput - The return type for the generateNewsArticle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateImage } from './image-generate-flow';

const NewsGeneratorInputSchema = z.object({
  topic: z.string().optional().describe('The topic of the news article. If empty, the AI will generate one.'),
  description: z.string().describe('A brief description or key points for the article.'),
});
export type NewsGeneratorInput = z.infer<typeof NewsGeneratorInputSchema>;

const NewsGeneratorOutputSchema = z.object({
  title: z.string().describe('The generated, catchy title for the news article.'),
  content: z.string().describe('The full article content in HTML format. This content MUST include at least two image placeholders in the format <!-- IMAGE_HINT: a descriptive hint for an image --> where images would be visually appropriate.'),
  excerpt: z.string().describe('A short, engaging summary of the article (max 150 characters).'),
  category: z.string().describe('A suggested category for the news article (e.g., Pertanian, Perikanan, Kehutanan, Konservasi, Teknologi, Komunitas, Acara).'),
  imageHints: z.array(z.string()).describe('An array of descriptive text hints for images to be generated, extracted from the placeholders in the content.'),
  coverImageUrl: z.string().describe('The URL of the generated cover image for the article.'),
});
export type NewsGeneratorOutput = z.infer<typeof NewsGeneratorOutputSchema>;

export async function generateNewsArticle(input: NewsGeneratorInput): Promise<NewsGeneratorOutput> {
  return newsGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'newsGeneratorPrompt',
  input: { schema: NewsGeneratorInputSchema },
  // The prompt itself doesn't generate the final hints array or URL
  // We specify the direct text-based output schema for the LLM call.
  output: { schema: NewsGeneratorOutputSchema.omit({ imageHints: true, coverImageUrl: true }) },
  prompt: `You are an expert journalist and content creator for Garda Lestari, a youth-led environmental and agricultural organization.
Your task is to write a complete news article based on the provided topic and description.

Your response must be in JSON format and adhere to the specified schema.

1.  **Topic**: If the topic is empty, create a relevant and engaging topic based on the description.
2.  **Title**: Write a compelling, SEO-friendly title.
3.  **Content**: Write a full, well-structured news article.
    - The content MUST be in HTML format (using <p>, <h2>, <ul>, <li>, <strong> tags).
    - CRITICAL: You must strategically embed at least TWO, but no more than three, image placeholders within the article's content. An image placeholder MUST look exactly like this: \`<!-- IMAGE_HINT: a very descriptive hint for an image -->\`. For example: \`<!-- IMAGE_HINT: young farmers smiling while holding fresh vegetables in a lush green field -->\`. Place these where an image would naturally fit to break up text and add visual interest.
    - The first placeholder hint will be used for the cover image. Make it a good one.
4.  **Excerpt**: Write a short summary (max 150 characters) for the article preview.
5.  **Category**: Suggest a single, relevant category from this list: Pertanian, Perikanan, Kehutanan, Konservasi, Teknologi, Komunitas, Acara.

**Input:**
- Topic: {{{topic}}}
- Description: {{{description}}}
`,
});

const newsGeneratorFlow = ai.defineFlow(
  {
    name: 'newsGeneratorFlow',
    inputSchema: NewsGeneratorInputSchema,
    outputSchema: NewsGeneratorOutputSchema,
  },
  async (input) => {
    // Generate the article text and initial data from the main prompt
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI Gagal mendapatkan draf artikel. Coba lagi.');
    }

    // Extract image hints from the generated HTML content
    const regex = /<!-- IMAGE_HINT: (.*?) -->/g;
    const hints = Array.from(output.content.matchAll(regex), match => match[1]);

    if (hints.length === 0) {
      throw new Error('AI gagal membuat petunjuk gambar. Coba lagi dengan deskripsi yang lebih detail.');
    }
    
    // Generate the cover image using the first hint
    const coverImageResult = await generateImage({ prompt: hints[0] });
    if (!coverImageResult.imageUrl) {
        throw new Error('Gagal membuat gambar utama untuk artikel.');
    }

    // Return the final combined output
    return {
      ...output,
      imageHints: hints,
      coverImageUrl: coverImageResult.imageUrl,
    };
  }
);
