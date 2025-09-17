
'use server';
/**
 * @fileOverview Agentic flow to bulk-generate news article drafts.
 * - bulkGenerateNewsDrafts: The main function to trigger the agent's workflow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateNewsArticle } from './news-generator-flow';
import { createBeritaPost, updateJobProgress } from '@/app/actions/berita';
import { sendNotification } from '@/app/actions/notifications';
import { getMembers } from '@/app/actions/members';

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
    console.log(`[Bulk Generate Flow] Starting job ${jobId} for ${topics.length} topics.`);
    
    for (const topic of topics) {
      try {
        // Step 1: Generate the article content and images
        const generatedArticle = await generateNewsArticle({
          topic: topic.title,
          description: topic.description,
          userImageUrls: [], // No user images in bulk mode for now
        });

        // Step 2: Save the article as a DRAFT
        const newPostDraft = await createBeritaPost({
          title: generatedArticle.title,
          slug: `draft-${Date.now()}-${generatedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`,
          content: generatedArticle.content,
          author: 'Garda Warta (AI)',
          date: new Date().toISOString(),
          imageUrl: generatedArticle.coverImageUrl,
          imageHint: generatedArticle.imageHints[0] || 'AI Generated',
          excerpt: generatedArticle.excerpt,
          category: generatedArticle.category,
          type: 'artikel',
          isFeatured: false,
          seoScore: 0,
          status: 'draft',
        });

        if (!newPostDraft || !newPostDraft.id) {
          throw new Error('Failed to save draft article to the database.');
        }

        // Step 3: Update job progress for success
        await updateJobProgress(jobId, 1);
        console.log(`[Bulk Generate Flow] Successfully generated draft for topic: "${topic.title}"`);

      } catch (error) {
        console.error(`[Bulk Generate Flow] Failed to generate article for topic: "${topic.title}". Error:`, error);
        // Update job progress with an error
        await updateJobProgress(jobId, 1, { topic: topic.title, error: (error as Error).message });
      }
    }
    
    // Step 4: Notify admins that the job is complete
    const allMembers = await getMembers();
    const adminIds = allMembers
        .filter(m => m.permissions.includes('manage_news'))
        .map(m => m.id);

    if (adminIds.length > 0) {
        await sendNotification(
            {
                title: 'Pembuatan Artikel Massal Selesai',
                body: `Proses pembuatan ${topics.length} draf artikel telah selesai. Silakan tinjau di panel berita.`,
                link: `/panel/berita/jobs/${jobId}`
            },
            { type: 'users', userIds: adminIds }
        );
    }
     console.log(`[Bulk Generate Flow] Job ${jobId} completed.`);
  }
);
