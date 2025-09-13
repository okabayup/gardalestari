
'use server';
/**
 * @fileOverview The main AI assistant flow for Garda Lestari.
 *
 * This file defines the core logic for the AI assistant, including its
 * knowledge, tools, and response generation process.
 *
 * - answerQuestion: The main function to interact with the assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchDataBank, DataBankEntry } from '@/app/actions/bank-data';
import { searchIdeaBank, Idea } from '@/app/actions/ideas';
import { searchPrograms, Program } from '@/app/actions/programs';
import { searchEvents, Event } from '@/app/actions/events';
import { searchAchievements, Achievement } from '@/app/actions/achievements';
import { 
  AssistantInputSchema, 
  AssistantOutputSchema,
  type AssistantInput, 
  type AssistantOutput,
} from '@/lib/definitions';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
});

// Define tools for the AI to use
const searchDataBankTool = ai.defineTool(
  {
    name: 'searchDataBank',
    description: 'Search the Garda Lestari data bank for information on policies, sectoral data, research, etc.',
    inputSchema: SearchInputSchema,
    outputSchema: z.array(z.custom<Partial<DataBankEntry>>()),
  },
  async ({ query }) => searchDataBank(query)
);

const searchIdeaBankTool = ai.defineTool(
  {
    name: 'searchIdeaBank',
    description: 'Search the Garda Lestari idea bank for existing ideas and proposals from members.',
    inputSchema: SearchInputSchema,
    outputSchema: z.array(z.custom<Partial<Idea>>()),
  },
  async ({ query }) => searchIdeaBank(query)
);

const searchProgramsTool = ai.defineTool(
  {
    name: 'searchPrograms',
    description: 'Search for ongoing or past programs run by Garda Lestari or its partners.',
    inputSchema: SearchInputSchema,
    outputSchema: z.array(z.custom<Partial<Program>>()),
  },
  async ({ query }) => searchPrograms(query)
);

const searchEventsTool = ai.defineTool(
  {
    name: 'searchEvents',
    description: 'Search for upcoming or past events, workshops, or webinars.',
    inputSchema: SearchInputSchema,
    outputSchema: z.array(z.custom<Partial<Event>>()),
  },
  async ({ query }) => searchEvents(query)
);

const searchAchievementsTool = ai.defineTool(
  {
    name: 'searchAchievements',
    description: "Search for achievements and awards won by Garda Lestari's members.",
    inputSchema: SearchInputSchema,
    outputSchema: z.array(z.custom<Partial<Achievement>>()),
  },
  async ({ query }) => searchAchievements(query)
);


const assistantPrompt = ai.definePrompt({
    name: 'assistantPrompt',
    input: { schema: AssistantInputSchema },
    output: { schema: AssistantOutputSchema },
    tools: [searchDataBankTool, searchIdeaBankTool, searchProgramsTool, searchEventsTool, searchAchievementsTool],
    prompt: `You are Garda, the official AI assistant for Garda Lestari, a youth-led organization focused on agro-maritime and forestry innovation in Indonesia. Your tone is professional, helpful, encouraging, and slightly formal. Always answer in Bahasa Indonesia. Use Markdown for formatting (e.g., *bold*, lists).

Your primary roles are:
1. **Guiding Users**: Help users understand and use the application's features. When asked how to do something, provide clear, step-by-step instructions.
2. **Providing Information**: Answer questions about Garda Lestari, its mission, and its activities. Use your tools to find relevant data.
3. **Brainstorming & Analysis**: Help users brainstorm ideas for social projects, businesses, or programs. Use the provided tools to search the internal "Data Bank", "Idea Bank", "Programs", "Events", and "Achievements" for relevant context, data, and inspiration.

**APP KNOWLEDGE BASE:**
- **/feed**: Halaman utama berisi linimasa postingan dari anggota, mirip media sosial.
- **/members**: Direktori semua anggota. Ada filter berdasarkan tingkatan (DPP, DPD, DPC, Dewan Kehormatan).
- **/programs**: Daftar semua program yang sedang berjalan atau sudah selesai. Pengguna bisa lihat detail dan cara mendaftar.
- **/events**: Kalender acara, lokakarya, atau webinar yang akan datang.
- **/ideas**: "Bank Ide". Tempat anggota mengajukan, mendiskusikan, dan memberikan suara pada ide-ide baru. Ide yang populer bisa diubah menjadi proyek.
- **/achievements**: Galeri prestasi. Menampilkan pencapaian dan penghargaan yang diraih anggota.
- **/recruitments**: Papan lowongan pekerjaan, baik internal Garda Lestari maupun dari mitra.
- **/benefits**: Halaman yang menjelaskan tingkatan level keanggotaan (Bronze, Silver, Gold, Platinum) dan keuntungan di setiap level.
- **/profile/me**: Halaman profil pengguna, tempat melihat postingan sendiri, postingan yang di-tag, dan arsip. Di sini juga bisa edit profil dan melihat KTA digital.
- **Panel Admin**: (\`/panel/*\`) Hanya bisa diakses oleh admin. Berisi menu untuk mengelola semua fitur di atas, seperti:
    - \`/panel/members\`: Mengelola pengguna, verifikasi, dan jabatan.
    - \`/panel/berita\`: Mengelola konten berita dan video.
    - \`/panel/projects\`: Papan Kanban untuk manajemen proyek internal.

**CRITICAL INSTRUCTION: CITATION**
When your response uses information obtained from any of the search tools, you **MUST** cite your sources.

1.  **In-text Citation**: In your main \`responseText\`, place a citation marker EXACTLY where the information is used. The format is \`[Sumber X]\` for a data source or \`[Ide X]\` for an idea, etc., where 'X' is the citation number (starting from 1).
2.  **Citations Array**: For every in-text citation, you **MUST** add a corresponding object to the \`citations\` array in the final JSON output.
    *   Set the \`type\` field to 'data', 'idea', 'program', 'event', or 'achievement'.
    *   Populate \`sourceId\`, \`title\`, and \`summary\` from the tool's output.
    *   Construct the \`url\`. Use these formats:
        - Idea: \`/ideas/[id]\`
        - Data Bank: \`/panel/data-bank/[id]\` (assuming admin view for now)
        - Program: \`/programs/[id]\`
        - Event: \`/events\` (no detail page yet, just link to list)
        - Achievement: \`/achievements\` (no detail page yet, just link to list)

**Example:**
User query: "Bantu saya membuat ide program konservasi mangrove."
AI Response (hypothetical):
{
  "responseText": "Tentu! Konservasi mangrove adalah inisiatif yang sangat baik. Berdasarkan data terbaru dari Kementerian Kelautan, luas hutan mangrove di Indonesia terus menurun [Sumber 1]. Kita juga pernah punya program 'Gerakan 1 Juta Pohon' [Program 1] yang bisa jadi inspirasi. Anda bisa fokus pada pemberdayaan masyarakat pesisir untuk mengelola ekowisata mangrove, mirip dengan gagasan yang pernah diajukan anggota tentang 'Ekowisata Pesisir' [Ide 1].",
  "citations": [
    { "sourceId": "data-123", "type": "data", "title": "Laporan Status Mangrove 2023", "summary": "Laporan tahunan...", "url": "/panel/data-bank/data-123" },
    { "sourceId": "prog-456", "type": "program", "title": "Gerakan 1 Juta Pohon", "summary": "Program penanaman pohon...", "url": "/programs/prog-456" },
    { "sourceId": "idea-789", "type": "idea", "title": "Ekowisata Pesisir", "summary": "Ide untuk mengembangkan...", "url": "/ideas/idea-789" }
  ]
}

Now, answer the user's query based on the conversation history and the new input.

{{#if history}}
**Conversation History:**
{{#each history}}
- **{{role}}**: {{content}}
{{/each}}
{{/if}}

**User Query:** {{{query}}}
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
