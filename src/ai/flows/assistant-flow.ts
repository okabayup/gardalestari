'use server';
/**
 * @fileOverview The main AI assistant flow for Garda Lestari.
 *
 * This file defines the core logic for the AI assistant, including its
 * knowledge, tools, and response generation process.
 *
 * - answerQuestion: The main function to interact with the assistant.
 * - AssistantInput: The Zod schema for the assistant's input.
 * - AssistantOutput: The Zod schema for the assistant's structured output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchDataBank, DataBankEntry } from '@/app/actions/bank-data';
import { searchIdeaBank, Idea } from '@/app/actions/ideas';
import { format } from 'date-fns';

// Define tools for the AI to use
const searchDataBankTool = ai.defineTool(
  {
    name: 'searchDataBank',
    description: 'Search the Garda Lestari data bank for information on policies, sectoral data, research, etc.',
    input: { schema: z.string() },
    output: { schema: z.array(z.custom<Partial<DataBankEntry>>()) },
  },
  async (query) => searchDataBank(query)
);

const searchIdeaBankTool = ai.defineTool(
  {
    name: 'searchIdeaBank',
    description: 'Search the Garda Lestari idea bank for existing ideas and proposals from members.',
    input: { schema: z.string() },
    output: { schema: z.array(z.custom<Partial<Idea>>()) },
  },
  async (query) => searchIdeaBank(query)
);


// Define input and output schemas
export const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question or request.'),
  userId: z.string().describe('The ID of the user asking the question.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const CitationSchema = z.object({
  sourceId: z.string().describe('The unique ID of the source document or idea.'),
  type: z.enum(['data', 'idea']).describe('The type of the source.'),
  title: z.string().describe('The title of the source.'),
  summary: z.string().describe('A brief summary of the source content.'),
  url: z.string().describe('The URL to view the full source.'),
});

export const AssistantOutputSchema = z.object({
  responseText: z.string().describe('The main text of the AI\'s answer, formatted in Markdown. This text MUST include citation markers like [Source 1], [Idea 2], etc., corresponding to the `citations` array.'),
  citations: z.array(CitationSchema).describe('An array of sources cited in the `responseText`.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


const assistantPrompt = ai.definePrompt({
    name: 'assistantPrompt',
    input: { schema: AssistantInputSchema },
    output: { schema: AssistantOutputSchema },
    tools: [searchDataBankTool, searchIdeaBankTool],
    prompt: `You are Garda, the official AI assistant for Garda Lestari, a youth-led organization focused on agro-maritime and forestry innovation in Indonesia. Your tone is professional, helpful, encouraging, and slightly formal. Always answer in Bahasa Indonesia.

Your primary roles are:
1.  **Guiding Users**: Help users understand and use the application's features (e.g., "Bagaimana cara mengajukan ide baru?", "Di mana saya bisa melihat program yang sedang berjalan?").
2.  **Providing Information**: Answer questions about Garda Lestari, its mission, and its activities.
3.  **Brainstorming & Analysis**: Help users brainstorm ideas for social projects, businesses, or programs. Use the provided tools to search the internal "Data Bank" and "Idea Bank" for relevant context, data, and inspiration.

**CRITICAL INSTRUCTION: CITATION**
When your response uses information obtained from the \`searchDataBank\` or \`searchIdeaBank\` tools, you **MUST** cite your sources.

1.  **In-text Citation**: In your main \`responseText\`, place a citation marker EXACTLY where the information is used. The format is \`[Sumber X]\` for a data source or \`[Ide X]\` for an idea, where 'X' is the citation number (starting from 1).
2.  **Citations Array**: For every in-text citation, you **MUST** add a corresponding object to the \`citations\` array in the final JSON output.
    *   Set the \`type\` field to 'data' or 'idea'.
    *   Populate \`sourceId\`, \`title\`, and \`summary\` from the tool's output.
    *   Construct the \`url\` field: for ideas, use \`/ideas/[id]\`; for data bank entries, use \`/panel/data-bank/[id]\`.

**Example:**
User query: "Bantu saya membuat ide program konservasi mangrove."

AI Response (hypothetical):
{
  "responseText": "Tentu! Konservasi mangrove adalah inisiatif yang sangat baik. Berdasarkan data terbaru dari Kementerian Kelautan, luas hutan mangrove di Indonesia terus menurun [Sumber 1]. Program restorasi bisa menjadi solusi, mirip dengan gagasan yang pernah diajukan anggota tentang 'penanaman 1 juta pohon' [Ide 1]. Anda bisa fokus pada pemberdayaan masyarakat pesisir untuk mengelola ekowisata mangrove.",
  "citations": [
    {
      "sourceId": "data-doc-123",
      "type": "data",
      "title": "Laporan Status Mangrove Nasional 2023",
      "summary": "Laporan tahunan yang menunjukkan penurunan luas hutan mangrove sebesar 5%...",
      "url": "/panel/data-bank/data-doc-123"
    },
    {
      "sourceId": "idea-abc-456",
      "type": "idea",
      "title": "Gerakan Penanaman 1 Juta Pohon",
      "summary": "Sebuah ide untuk menggalang relawan menanam pohon di berbagai wilayah...",
      "url": "/ideas/idea-abc-456"
    }
  ]
}

**General Knowledge about Garda Lestari:**
-   **Mission**: To be a leading incubator for young innovators in agro-maritime and forestry for sustainable and inclusive economic development.
-   **Core Focus**: Smart Agriculture, Empowered Maritime, Sustainable Forestry.
-   **Key Activities**: Incubation, acceleration, funding access, internships, and policy advocacy.
-   **App Features**: Feed (social), Ideas Bank, Programs, Events, Member Directory, E-Office (documents), Projects.

Now, answer the user's query.

User Query: {{{query}}}
`,
});

const assistantFlow = ai.defineFlow(
    {
      name: 'assistantFlow',
      inputSchema: AssistantInputSchema,
      outputSchema: AssistantOutputSchema,
    },
    async (input) => {
        const llmResponse = await assistantPrompt(input);
        const output = llmResponse.output;

        if (!output) {
            throw new Error('AI assistant failed to generate a response.');
        }

        // Ensure the final output matches the schema, even if the model makes a mistake.
        return {
            responseText: output.responseText || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.',
            citations: output.citations || [],
        };
    }
);

export async function answerQuestion(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}
