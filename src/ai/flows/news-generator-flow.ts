
'use server';
/**
 * @fileOverview A flow to generate a full news article from a topic and description.
 *
 * - generateNewsArticle - A function that generates a title, content with image placeholders, an excerpt, a category, and a cover image.
 * - NewsGeneratorInput - The input type for the generateNewsArticle function.
 * - NewsGeneratorOutput - The return type for the generateNewsArticle function.
 * - suggestNewsTopics - A function that suggests SEO-friendly news topics.
 * - NewsTopicSuggestionOutput - The return type for the suggestNewsTopics function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateImage } from './image-generate-flow';
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const NewsGeneratorInputSchema = z.object({
  topic: z.string().optional().describe('The topic of the news article. If empty, the AI will generate one.'),
  description: z.string().describe('A brief description or key points for the article.'),
});
export type NewsGeneratorInput = z.infer<typeof NewsGeneratorInputSchema>;

const NewsGeneratorOutputSchema = z.object({
  title: z.string().describe('The generated, catchy title for the news article.'),
  content: z.string().describe('The full article content in HTML format. This content is final and includes actual <img> tags for the generated images.'),
  excerpt: z.string().describe('A short, engaging summary of the article (max 150 characters).'),
  category: z.string().describe('A suggested category for the news article (e.g., Pertanian, Perikanan, Kehutanan, Konservasi, Teknologi, Komunitas, Acara).'),
  imageHints: z.array(z.string()).describe('An array of descriptive text hints for images that were generated, extracted from the initial placeholders.'),
  coverImageUrl: z.string().describe('The URL of the generated cover image for the article.'),
});
export type NewsGeneratorOutput = z.infer<typeof NewsGeneratorOutputSchema>;

const NewsTopicSuggestionOutputSchema = z.object({
  topics: z.array(z.object({
    title: z.string().describe('The suggested news title.'),
    description: z.string().describe('A short (one sentence) description of what the article would be about.'),
    keywords: z.array(z.string()).describe('A list of 2-3 relevant SEO keywords for the topic.'),
  })).describe('A list of 5 news topic suggestions.'),
});
export type NewsTopicSuggestionOutput = z.infer<typeof NewsTopicSuggestionOutputSchema>;


export async function generateNewsArticle(input: NewsGeneratorInput): Promise<NewsGeneratorOutput> {
  return newsGeneratorFlow(input);
}

export async function suggestNewsTopics(): Promise<NewsTopicSuggestionOutput> {
    const topicSuggestionPrompt = ai.definePrompt({
        name: 'newsTopicSuggestionPrompt',
        output: { schema: NewsTopicSuggestionOutputSchema },
        prompt: `You are an expert SEO strategist and journalist for Garda Lestari, a youth-led environmental and agricultural organization in Indonesia.
Your task is to brainstorm 5 highly relevant and SEO-friendly news article topics based on current trends and common search queries in Indonesia related to agriculture, maritime, forestry, conservation, and youth innovation.

For each topic, provide a catchy title, a short description, and a list of relevant SEO keywords.
The topics should be engaging, informative, and aligned with Garda Lestari's mission.

Example topics could be about:
- Sustainable farming techniques for young farmers.
- The role of technology in modern fishing.
- Community-led forest conservation efforts.
- Success stories of young eco-entrepreneurs.

Provide the output in the requested JSON format.
`,
    });

    const { output } = await topicSuggestionPrompt();
    if (!output) {
      throw new Error('Gagal mendapatkan saran topik dari AI.');
    }
    return output;
}


const prompt = ai.definePrompt({
  name: 'newsGeneratorPrompt',
  input: { schema: NewsGeneratorInputSchema },
  output: { schema: NewsGeneratorOutputSchema.omit({ imageHints: true, coverImageUrl: true }) },
  prompt: `You are an expert journalist and content creator for Garda Lestari, a youth-led environmental and agricultural organization in Indonesia. Your writing style is humanized, professional, informative, dense with information but easy to read.

Your task is to write a complete, high-quality news article based on the provided topic and description. The article must be well-researched, well-structured, and optimized for SEO.

**CONTEXT & KEY POINTS:**
Use the following description as the main source of information, key points, and context for the article. Expand on these points to create a comprehensive article.
- Topic: {{{topic}}}
- Key Points/Description: {{{description}}}

**CRITICAL INSTRUCTIONS:**

1.  **Topic and Title**:
    -   Based on the context, create a compelling, SEO-friendly title that includes relevant keywords.
    -   The final title must be engaging and accurately reflect the article's content.

2.  **Content (HTML Format)**:
    -   The content MUST be in well-structured HTML, using tags like \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`, and \`<strong>\`.
    -   The article must be dense and informative, using the provided "Key Points/Description" as the foundation. Provide details, data, or examples to support the points. Avoid fluffy or generic statements.
    -   Incorporate relevant SEO keywords naturally throughout the article, especially in headings and the first paragraph. Keywords could include "pertanian berkelanjutan", "inovasi pemuda", "konservasi hutan", "ekonomi biru", "teknologi perikanan", etc., depending on the topic.
    -   The tone must be professional yet accessible (humanized). Address the reader and explain complex topics simply.

3.  **Image Placeholders (CRITICAL)**:
    -   You MUST strategically embed AT LEAST TWO, but no more than three, image placeholders within the article's content.
    -   An image placeholder MUST look exactly like this: \`<!-- IMAGE_HINT: a very descriptive and professional photo prompt for an image -->\`.
    -   Example: \`<!-- IMAGE_HINT: close-up shot of a young farmer smiling while holding freshly harvested organic vegetables in a lush green field during golden hour -->\`.
    -   The FIRST image hint will be used for the article's cover image. Make it powerful and visually appealing.

4.  **Excerpt**:
    -   Write a short, engaging summary of the article (max 150 characters) for social media and search engine previews.

5.  **Category**:
    -   Suggest a single, relevant category from this list: Pertanian, Perikanan, Kehutanan, Konservasi, Teknologi, Komunitas, Acara.

Now, generate the complete, high-quality article in the requested JSON format based on the provided context.
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
    
    // Generate all images in parallel
    const imageGenerationPromises = hints.map(hint => generateImage({ prompt: hint }));
    const imageResults = await Promise.all(imageGenerationPromises);
    
    // Upload generated images to Firebase Storage and get URLs
    const imageUrlPromises = imageResults.map(async (result, index) => {
        if (!result.imageUrl) {
            throw new Error(`Gambar untuk petunjuk "${hints[index]}" gagal dibuat.`);
        }
        const storageRef = ref(storage, `news-images/${Date.now()}_${index}.png`);
        await uploadString(storageRef, result.imageUrl, 'data_url');
        return getDownloadURL(storageRef);
    });

    const imageUrls = await Promise.all(imageUrlPromises);

    if (imageUrls.some(url => !url)) {
        throw new Error('Satu atau lebih gambar gagal diunggah ke penyimpanan.');
    }

    // Replace placeholders with actual image tags using the public URLs
    let finalContent = output.content;
    const placeholders = Array.from(output.content.matchAll(regex), match => match[0]);

    placeholders.forEach((placeholder, index) => {
        const imageUrl = imageUrls[index];
        const imageTag = `<img src="${imageUrl}" alt="${hints[index]}" style="width:100%;height:auto;border-radius:0.5rem;margin:1rem 0;" />`;
        finalContent = finalContent.replace(placeholder, imageTag);
    });

    const coverImageUrl = imageUrls[0];
    if (!coverImageUrl) {
      throw new Error('Gagal membuat gambar sampul. URL gambar sampul tidak tersedia.');
    }


    // Return the final combined output
    return {
      ...output,
      content: finalContent,
      imageHints: hints,
      coverImageUrl: coverImageUrl,
    };
  }
);

    