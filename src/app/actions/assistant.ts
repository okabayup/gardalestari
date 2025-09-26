
'use server';

/**
 * @fileoverview This file acts as a client-safe entry point for the assistant AI flow.
 * It re-exports the main function from the flow file, ensuring that heavy server-side
 * dependencies within the flow are not bundled into the client-side JavaScript.
 */

import { answerQuestion as answerQuestionFlow } from '@/ai/flows/assistant-flow';
import type { AssistantInput, AssistantOutput } from '@/lib/definitions';

/**
 * A client-callable Server Action that executes the main assistant AI flow.
 * @param input The user's query, history, and optional image.
 * @returns The AI's response and any citations.
 */
export async function answerQuestion(input: AssistantInput): Promise<AssistantOutput> {
  return answerQuestionFlow(input);
}
