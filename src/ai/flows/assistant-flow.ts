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
import { searchDataBank } from '@/app/actions/bank-data';
import { searchIdeaBank } from '@/app/actions/ideas';
import { searchPrograms } from '@/app/actions/programs';
import { searchEvents } from '@/app/actions/events';
import { searchAchievements } from '@/app/actions/achievements';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  AssistantInputSchema, 
  AssistantOutputSchema,
  type AssistantInput, 
  type AssistantOutput,
} from '@/lib/definitions';
import type { Message, Part } from 'genkit';
import { generateImage as generateImageFlow } from './image-generate-flow';


// Define tools for the AI to use
const searchDataBankTool = ai.defineTool(
  {
    name: 'searchDataBank',
    description: 'Search the Garda Lestari data bank for information on policies, sectoral data, research, etc.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async ({ query }) => searchDataBank(query)
);

const searchIdeaBankTool = ai.defineTool(
  {
    name: 'searchIdeaBank',
    description: 'Search the Garda Lestari idea bank for existing ideas and proposals from members.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async ({ query }) => searchIdeaBank(query)
);

const searchProgramsTool = ai.defineTool(
  {
    name: 'searchPrograms',
    description: 'Search for ongoing or past programs run by Garda Lestari or its partners.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async ({ query }) => searchPrograms(query)
);

const searchEventsTool = ai.defineTool(
  {
    name: 'searchEvents',
    description: 'Search for upcoming or past events, workshops, or webinars.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async ({ query }) => searchEvents(query)
);

const searchAchievementsTool = ai.defineTool(
  {
    name: 'searchAchievements',
    description: "Search for achievements and awards won by Garda Lestari's members.",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async ({ query }) => searchAchievements(query)
);

const createDocumentTool = ai.defineTool(
  {
    name: 'createDocument',
    description: 'Generates a formal document (.docx or .pdf) based on a given prompt, such as creating a proposal, official letter, or report. The generated document will be saved to cloud storage, and the function will return a public download URL.',
    inputSchema: z.object({ 
      prompt: z.string().describe('A detailed prompt describing the content and format of the document to be generated. For example: "Buat draf surat permohonan audiensi kepada Menteri Pertanian dalam format PDF."'),
      fileName: z.string().describe('The desired file name for the document, ending with .docx or .pdf. For example: "proposal-kemitraan.docx" atau "laporan-kegiatan.pdf".'),
     }),
    outputSchema: z.object({ downloadUrl: z.string().describe('The public URL to download the generated file.') }),
  },
  async ({ prompt, fileName }) => {
    console.log(`[createDocumentTool] Starting document generation for: ${fileName}`);
    try {
        const generationResponse = await ai.generate({
            prompt: `You are an expert administrative assistant. Generate the full text content for the following document request. The output must be plain text, well-formatted with clear headings and paragraphs. Do not use Markdown.\n\nDOCUMENT REQUEST: "${prompt}"`,
            config: { temperature: 0.3 }
        });

        const content = generationResponse.text;
        if (!content) {
            throw new Error("AI failed to generate document content.");
        }
        
        let buffer: Buffer;
        let contentType: string;
        
        const fileExtension = fileName.split('.').pop()?.toLowerCase();

        if (fileExtension === 'pdf') {
            // Generate PDF
            contentType = 'application/pdf';
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = 12;

            page.drawText(content, {
                x: 50,
                y: height - 4 * fontSize,
                font,
                fontSize,
                lineHeight: 15,
                maxWidth: width - 100,
            });

            const pdfBytes = await pdfDoc.save();
            buffer = Buffer.from(pdfBytes);
        } else if (fileExtension === 'docx') {
            // Generate DOCX
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            const paragraphs = content.split('\n').filter(p => p.trim() !== '').map(p => new Paragraph({
                children: [new TextRun(p)],
                spacing: { after: 200 },
            }));

            const doc = new DocxDocument({
                sections: [{
                    properties: {},
                    children: paragraphs,
                }],
            });
            buffer = await Packer.toBuffer(doc);
        } else {
             throw new Error(`Unsupported file format: .${fileExtension}. Please use .docx or .pdf`);
        }
        
        const storageRef = ref(storage, `ai-generated-docs/${Date.now()}_${fileName}`);
        await uploadBytes(storageRef, buffer, { contentType });
        
        const downloadUrl = await getDownloadURL(storageRef);
        console.log(`[createDocumentTool] Document successfully generated and uploaded to: ${downloadUrl}`);
        
        return { downloadUrl };
    } catch (error) {
        console.error(`[createDocumentTool Error]`, error);
        throw new Error(`Failed to generate document: ${(error as Error).message}`);
    }
  }
);

const generateImageTool = ai.defineTool(
    {
        name: 'generateImage',
        description: 'Generates an image from a text prompt and returns its public URL.',
        inputSchema: z.object({
            prompt: z.string().describe('A detailed, professional photograph prompt for the image to be generated.'),
        }),
        outputSchema: z.object({
            imageUrl: z.string().describe('The public URL of the generated image.'),
        }),
    },
    async ({ prompt }) => {
        console.log(`[generateImageTool] Generating image with prompt: "${prompt}"`);
        try {
            const { imageUrl } = await generateImageFlow({ prompt });
            if (!imageUrl) {
                throw new Error("Image generation failed to return a URL.");
            }
            const storageRef = ref(storage, `ai-generated-images/${Date.now()}.png`);
            // The flow now returns a full data URI, so we need to handle it.
            const isDataUri = imageUrl.startsWith('data:');
            const buffer = isDataUri 
                ? Buffer.from(imageUrl.split(',')[1], 'base64')
                : Buffer.from(await(await fetch(imageUrl)).arrayBuffer());
            const contentType = isDataUri ? imageUrl.split(';')[0].split(':')[1] : 'image/png';
            
            await uploadBytes(storageRef, buffer, { contentType });
            const downloadUrl = await getDownloadURL(storageRef);
            console.log(`[generateImageTool] Image successfully generated and uploaded to: ${downloadUrl}`);
            return { imageUrl: downloadUrl };
        } catch (error) {
            console.error(`[generateImageTool Error]`, error);
            throw new Error(`Failed to generate image: ${(error as Error).message}`);
        }
    }
);


const availableTools: Record<string, any> = {
    searchDataBank: searchDataBankTool,
    searchIdeaBank: searchIdeaBankTool,
    searchPrograms: searchProgramsTool,
    searchEvents: searchEventsTool,
    searchAchievements: searchAchievementsTool,
    createDocument: createDocumentTool,
    generateImage: generateImageTool,
};

const systemPrompt = `You are Garda, the official AI assistant for Garda Lestari, a youth-led organization focused on agro-maritime and forestry innovation in Indonesia. Your tone is professional, helpful, encouraging, and slightly formal. Always answer in Bahasa Indonesia. Use Markdown for formatting (e.g., *bold*, lists).

Your primary roles are:
1. **Guiding Users**: Help users understand and use the application's features. When asked how to do something, provide clear, step-by-step instructions.
2. **Providing Information**: Answer questions about Garda Lestari, its mission, and its activities. Use your tools to find relevant data.
3. **Brainstorming & Analysis**: Help users brainstorm ideas for social projects, businesses, or programs. Use the provided tools to search the internal "Data Bank", "Idea Bank", "Programs", "Events", and "Achievements" for relevant context, data, and inspiration. You can also analyze images provided by the user.
4. **Generating Documents**: If a user asks to "create", "make", or "generate" a document, letter, or proposal, use the 'createDocument' tool. The user MUST specify a file name with a .docx or .pdf extension. If they don't, ask them for the file name and format. After the tool succeeds, your response MUST include a prominent Markdown link to the download URL.
5. **Generating Images**: If a user asks to "generate", "create", "make", or "draw" an image or picture, use the 'generateImage' tool. After the tool succeeds, your response MUST include a prominent Markdown-formatted image (\`![prompt](url)\`) to display it.

**APP KNOWLEDGE BASE:**
- \`/feed\`: Halaman utama berisi linimasa postingan dari anggota, mirip media sosial.
- \`/members\`: Direktori semua anggota. Ada filter berdasarkan tingkatan (DPP, DPD, DPC, Dewan Kehormatan).
- \`/programs\`: Daftar semua program yang sedang berjalan atau sudah selesai. Pengguna bisa lihat detail dan cara mendaftar.
- \`/events\`: Kalender acara, lokakarya, atau webinar yang akan datang.
- \`/ideas\`: "Bank Ide". Tempat anggota mengajukan, mendiskusikan, dan memberikan suara pada ide-ide baru. Ide yang populer bisa diubah menjadi proyek.
- \`/achievements\`: Galeri prestasi. Menampilkan pencapaian dan penghargaan yang diraih anggota.
- \`/recruitments\`: Papan lowongan pekerjaan, baik internal Garda Lestari maupun dari mitra.
- \`/benefits\`: Halaman yang menjelaskan tingkatan level keanggotaan (Bronze, Silver, Gold, Platinum) dan keuntungan di setiap level.
- \`/profile/me\`: Halaman profil pengguna, tempat melihat postingan sendiri, postingan yang di-tag, dan arsip. Di sini juga bisa edit profil dan melihat KTA digital.
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
`;

const assistantFlow = ai.defineFlow(
    {
      name: 'assistantFlow',
      inputSchema: AssistantInputSchema,
      outputSchema: AssistantOutputSchema,
    },
    async (input) => {
        console.log('[assistantFlow] Received input:', JSON.stringify(input, null, 2));
        const { query, history, image } = input;
        
        const tools = Object.values(availableTools);

        const generationConfig = {
            temperature: 0.2,
        };
        
        const userPrompt: Part[] = [{ text: query }];
        if (image) {
            userPrompt.push({ media: { url: image } });
        }

        const messages: Message[] = [
            ...history?.map(h => ({ role: h.role, content: [{ text: h.content }] } as Message)) || [],
            { role: 'user', content: userPrompt } as Message,
        ];

        try {
            console.log('[assistantFlow] Initial generation call...');
            let { candidates } = await ai.generate({
                tools,
                system: systemPrompt,
                messages,
                config: generationConfig,
                output: {
                    format: 'json',
                    schema: AssistantOutputSchema
                },
            });

            if (!candidates[0]) {
                throw new Error('AI failed to generate a response.');
            }

            let choice = candidates[0];
            
            // Loop to handle tool calls
            while(true) {
                const toolCalls = choice.message.content.filter(p => !!p.toolCall);
                if (!toolCalls || toolCalls.length === 0) {
                    break; // No more tool calls, exit loop
                }

                console.log(`[assistantFlow] Processing ${toolCalls.length} tool call(s).`);
                const toolResponses: Part[] = [];

                for (const part of toolCalls) {
                    const call = part.toolCall!;
                    console.log(`[assistantFlow] Calling tool: ${call.name} with args:`, call.args);
                    const tool = availableTools[call.name];
                    
                    if (!tool) {
                        const errorMsg = `Tool ${call.name} not found.`;
                        console.error(`[assistantFlow] ${errorMsg}`);
                        toolResponses.push({ 
                            toolResponse: { 
                                name: call.name, 
                                ref: call.ref, 
                                output: { error: errorMsg } 
                            } 
                        });
                        continue;
                    }
                    try {
                        const result = await tool.fn(call.args);
                        toolResponses.push({ 
                            toolResponse: { 
                                name: call.name, 
                                ref: call.ref, 
                                output: result 
                            } 
                        });
                        console.log(`[assistantFlow] Tool ${call.name} returned successfully.`);
                    } catch (e) {
                        const toolError = `Tool ${call.name} failed: ${(e as Error).message}`;
                        console.error(`[assistantFlow] ${toolError}`);
                        toolResponses.push({ 
                            toolResponse: { 
                                name: call.name, 
                                ref: call.ref, 
                                output: { error: toolError } 
                            } 
                        });
                    }
                }
                
                messages.push(choice.message);
                messages.push({ role: 'tool', content: toolResponses });
                
                console.log('[assistantFlow] Re-generating with tool responses...');
                const nextResponse = await ai.generate({
                    tools,
                    system: systemPrompt,
                    messages,
                    config: generationConfig,
                    output: {
                        format: 'json',
                        schema: AssistantOutputSchema
                    },
                });
                if (!nextResponse.candidates[0]) {
                    throw new Error('AI failed to generate a subsequent response after tool call.');
                }
                choice = nextResponse.candidates[0];
            }
            
            const finalOutput = choice.output as AssistantOutput;
            if (finalOutput) {
                console.log('[assistantFlow] Final output generated:', JSON.stringify(finalOutput, null, 2));
                return {
                    responseText: finalOutput.responseText || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.',
                    citations: finalOutput.citations || [],
                };
            }
        } catch (e) {
             console.error('[assistantFlow] Critical error during generation pipeline:', e);
             throw new Error(`AI assistant failed to generate a valid response: ${(e as Error).message}`);
        }
        
       throw new Error('AI assistant failed to generate a valid response after processing all candidates.');
    }
);

export async function answerQuestion(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}
