
'use server';

import { searchDataBank } from './bank-data';
import { searchEvents } from './events';
import { searchIdeaBank } from './ideas';
import { searchPrograms } from './programs';
import { searchUsers } from './members';
import type { DataBankEntry, Event, Idea, Program, PublicUser } from '@/lib/definitions';

export interface GlobalSearchResults {
  members: Partial<PublicUser>[];
  programs: Partial<Program>[];
  ideas: Partial<Idea>[];
  events: Partial<Event>[];
  dataBank: Partial<DataBankEntry>[];
}

/**
 * Performs a global search across multiple collections.
 * @param query The search query string.
 * @returns An object containing arrays of search results from different collections.
 */
export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  if (!query || query.trim().length < 2) {
    return { members: [], programs: [], ideas: [], events: [], dataBank: [] };
  }

  try {
    const [
        members, 
        programs, 
        ideas, 
        events, 
        dataBank
    ] = await Promise.all([
      searchUsers(query, 3),
      searchPrograms(query),
      searchIdeaBank(query),
      searchEvents(query),
      searchDataBank(query),
    ]);

    return { members, programs, ideas, events, dataBank };
  } catch (error) {
    console.error("[globalSearch Error]", error);
    throw new Error("Gagal melakukan pencarian global.");
  }
}
