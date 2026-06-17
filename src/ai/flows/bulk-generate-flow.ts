
'use server';
/**
 * @fileOverview Agentic flow to bulk-generate news article drafts.
 * This flow is designed to be triggered for tracking purposes, but the main logic
 * is now handled on the client-side for better user experience.
 * - bulkGenerateNewsDrafts: The main function to trigger the agent's workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// The main generation and saving logic has been moved to the client-side component
// `src/app/panel/berita/newsroom/page.tsx` for a more interactive foreground process.
// This flow remains for potential future use or for tracking via AI developer UI.

const TopicSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const BulkGenerateInputSchema = z.object({
  topics: z.array(TopicSchema),
  jobId: z.string(),
});

export const bulkGenerateNewsDrafts = ai.defineFlow(
  {
    name: 'bulkGenerateNewsDrafts',
    inputSchema: BulkGenerateInputSchema,
    outputSchema: z.void(),
  },
  async ({ topics, jobId }) => {
    // This flow is now primarily for tracking. 
    // The client-side `newsroom` page handles the sequential generation.
    // This function can be called without awaiting from the client to register the job in Genkit.
    console.log(`[Bulk Generate Flow] Job ${jobId} for ${topics.length} topics has been initiated from the client.`);
  }
);
