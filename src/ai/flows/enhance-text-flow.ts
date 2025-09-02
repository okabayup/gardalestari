
'use server';
/**
 * @fileOverview A flow to enhance and analyze text content for a news editor.
 *
 * - enhanceText - A function that provides suggestions to improve text, generates a title, and provides a summary.
 * - EnhanceTextInput - The input type for the enhanceText function.
 * - EnhanceTextOutput - The return type for the enhanceText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EnhanceTextInputSchema = z.object({
  text: z.string().describe('The draft text of the news article to be enhanced.'),
});
export type EnhanceTextInput = z.infer<typeof EnhanceTextInputSchema>;

const EnhanceTextOutputSchema = z.object({
  improvedText: z.string().describe('The full text of the article with grammar, spelling, and style improvements, in Markdown format.'),
  suggestedTitle: z.string().describe('A catchy and relevant title for the article.'),
  summary: z.string().describe('A brief summary of the article content.'),
  seoScore: z.number().describe('An SEO score from 0 to 100, based on keyword relevance and structure.'),
  seoFeedback: z.string().describe('Specific feedback on how to improve the SEO score.'),
  ethicsScore: z.number().describe('A press ethics score from 0 to 100, checking for bias, fairness, and accuracy.'),
  ethicsFeedback: z.string().describe('Specific feedback regarding potential press ethics issues found in the text.'),
});
export type EnhanceTextOutput = z.infer<typeof EnhanceTextOutputSchema>;

export async function enhanceText(input: EnhanceTextInput): Promise<EnhanceTextOutput> {
  return enhanceTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceTextPrompt',
  input: { schema: EnhanceTextInputSchema },
  output: { schema: EnhanceTextOutputSchema },
  prompt: `You are an expert editor and AI assistant for a youth-led environmental and agricultural organization, Garda Lestari.
Your task is to analyze the provided article draft and enhance it.

Your response must be in JSON format and adhere to the specified schema.

1.  **Improve Text**: Review the entire article. Correct any grammatical errors, spelling mistakes, and awkward phrasing. Improve the flow and clarity. The output must be in Markdown format.
2.  **Suggest Title**: Create a compelling, catchy, and SEO-friendly title for the article.
3.  **Summarize**: Write a concise summary of the article's key points.
4.  **SEO Analysis**:
    -   Rate the article's SEO on a scale of 0-100. Consider keyword usage (e.g., "pertanian berkelanjutan", "pemuda", "konservasi"), readability, and structure.
    -   Provide specific, actionable feedback for improving the SEO score.
5.  **Press Ethics Analysis**:
    -   Rate the article's adherence to press ethics on a scale of 0-100. Check for neutrality, potential bias, sourcing, and fairness.
    -   Provide specific feedback on any ethical concerns.

Here is the article draft:

{{{text}}}
`,
});

const enhanceTextFlow = ai.defineFlow(
  {
    name: 'enhanceTextFlow',
    inputSchema: EnhanceTextInputSchema,
    outputSchema: EnhanceTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Gagal mendapatkan hasil dari model AI.');
    }
    return output;
  }
);
