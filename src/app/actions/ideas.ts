'use server';

import { revalidatePath } from 'next/cache';
export type { Idea, IdeaWithAuthor, IdeaAuthor, IdeaCategory, VoteType, IdeaStatus, IdeaType, Challenge } from '@/lib/definitions';
import type { Idea, IdeaWithAuthor, IdeaAuthor, IdeaCategory, VoteType, IdeaStatus, IdeaType, Challenge, CommentWithAuthor } from '@/lib/definitions';
import { getAll, getOne, getFirst, create, update, remove, count, now } from '@/lib/db';
import { checkAndAwardBadges } from '@/app/actions/badges';

const COL_IDEAS = 'ideas';
const COL_USERS = 'users';
const COL_CATEGORIES = 'ideaCategories';
const COL_CHALLENGES = 'challenges';
const COL_COMMENTS = 'ideaComments'; // flat table instead of subcollection

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

async function buildIdeaWithAuthor(idea: Idea, currentUserId?: string): Promise<IdeaWithAuthor | null> {
  try {
    const author = await getOne<Record<string, unknown>>(COL_USERS, idea.authorId);
    if (!author) {
      console.warn(`[buildIdeaWithAuthor] Author ${idea.authorId} not found for idea ${idea.id}`);
      return null;
    }

    const upvotes: string[] = (idea as any).upvotes ?? [];
    const downvotes: string[] = (idea as any).downvotes ?? [];
    let userVote: VoteType | undefined;
    if (currentUserId) {
      if (upvotes.includes(currentUserId)) userVote = 'up';
      else if (downvotes.includes(currentUserId)) userVote = 'down';
    }

    const { upvotes: _u, downvotes: _d, ...restOfData } = idea as any;
    return {
      ...restOfData,
      createdAt: idea.createdAt,
      author: {
        id: idea.authorId,
        name: (author.fullName ?? author.displayName ?? 'Unknown User') as string,
        username: (author.username ?? `user_${idea.authorId.substring(0, 5)}`) as string,
        avatarUrl: (author.avatarUrl ?? '') as string,
        type: author.type as any,
      },
      userVote,
    };
  } catch (error) {
    console.error(`[buildIdeaWithAuthor] Error for idea ${idea.id}:`, error);
    return null;
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createIdea(
  authorId: string,
  title: string,
  description: string,
  category: string,
  challengeId?: string
): Promise<string> {
  try {
    if (!authorId) throw new Error('Pengguna tidak terautentikasi.');
    let challengeTitle: string | undefined;
    if (challengeId) {
      const challenge = await getOne<Challenge>(COL_CHALLENGES, challengeId);
      if (challenge) challengeTitle = challenge.title;
    }

    const id = await create(COL_IDEAS, {
      title, description, category, authorId,
      status: 'diajukan',
      createdAt: now(),
      upvotes: [],
      downvotes: [],
      voteScore: 0,
      commentCount: 0,
      type: challengeId ? 'SOLUTION' : 'INNOVATIVE',
      challengeId,
      challengeTitle,
    });

    revalidatePath('/ideas');
    await checkAndAwardBadges(authorId, 'idea_count');
    return id;
  } catch (error) {
    console.error('[createIdea Error]', error);
    throw new Error('Gagal membuat ide baru.');
  }
}

export async function getIdeas(
  userId: string,
  sortBy: 'newest' | 'top' = 'top',
  categoryFilter?: string,
  searchQuery?: string,
  typeFilter?: 'ALL' | IdeaType
): Promise<IdeaWithAuthor[]> {
  try {
    const orderField = sortBy === 'top' ? 'voteScore' : 'createdAt';
    let ideas = await getAll<Idea>(COL_IDEAS, {
      orderBy: { field: orderField, direction: 'desc' },
      ...(categoryFilter && categoryFilter !== 'Semua'
        ? { where: { field: 'category', op: '==', value: categoryFilter } }
        : {}),
    });

    const withAuthors = (
      await Promise.all(ideas.map(idea => buildIdeaWithAuthor(idea, userId)))
    ).filter((p): p is IdeaWithAuthor => p !== null);

    return withAuthors
      .filter(idea => !typeFilter || typeFilter === 'ALL' || idea.type === typeFilter)
      .filter(idea => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return idea.title.toLowerCase().includes(q) || idea.description.toLowerCase().includes(q);
      });
  } catch (error) {
    console.error('[getIdeas Error]', error);
    throw new Error('Gagal memuat ide.');
  }
}

export async function searchIdeaBank(searchQuery: string): Promise<Partial<Idea>[]> {
  try {
    const all = await getAll<Idea>(COL_IDEAS, {
      orderBy: { field: 'voteScore', direction: 'desc' },
      limit: 50,
    });
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter(e => {
        const text = `${e.title} ${e.description} ${e.category}`.toLowerCase();
        return terms.some(t => text.includes(t));
      })
      .slice(0, 5)
      .map(({ id, title, description, category, voteScore, commentCount }) => ({
        id, title, description, category, voteScore, commentCount,
      }));
  } catch (error) {
    console.error('[searchIdeaBank Error]', error);
    throw new Error('Gagal mencari di bank ide.');
  }
}

export async function getIdeaById(ideaId: string, currentUserId?: string): Promise<IdeaWithAuthor | null> {
  try {
    const idea = await getOne<Idea>(COL_IDEAS, ideaId);
    if (!idea) return null;
    return buildIdeaWithAuthor(idea, currentUserId);
  } catch (error) {
    console.error('[getIdeaById Error]', error);
    throw new Error('Gagal mengambil detail ide.');
  }
}

export async function updateIdeaStatus(ideaId: string, status: IdeaStatus) {
  try {
    await update(COL_IDEAS, ideaId, { status });
    revalidatePath('/ideas');
    revalidatePath(`/ideas/${ideaId}`);
  } catch (error) {
    console.error('[updateIdeaStatus Error]', error);
    throw new Error('Gagal memperbarui status ide.');
  }
}

export async function toggleVote(ideaId: string, userId: string, voteType: VoteType) {
  try {
    const idea = await getOne<Idea>(COL_IDEAS, ideaId) as any;
    if (!idea) throw new Error('Ide tidak ditemukan!');

    let upvotes: string[] = idea.upvotes ?? [];
    let downvotes: string[] = idea.downvotes ?? [];

    if (voteType === 'up') {
      upvotes = upvotes.includes(userId) ? upvotes.filter(u => u !== userId) : [...upvotes, userId];
      downvotes = downvotes.filter(u => u !== userId);
    } else {
      downvotes = downvotes.includes(userId) ? downvotes.filter(u => u !== userId) : [...downvotes, userId];
      upvotes = upvotes.filter(u => u !== userId);
    }

    const voteScore = upvotes.length - downvotes.length;
    await update(COL_IDEAS, ideaId, { upvotes, downvotes, voteScore });

    revalidatePath('/ideas');
    revalidatePath(`/ideas/${ideaId}`);
  } catch (error) {
    console.error('[toggleVote Error]', error);
    throw new Error('Gagal memberikan suara.');
  }
}

// ─── Comments (flat table) ────────────────────────────────────────────────────

export async function addIdeaComment(ideaId: string, userId: string, text: string) {
  try {
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');
    if (!text.trim()) throw new Error('Komentar tidak boleh kosong.');

    await create(COL_COMMENTS, { ideaId, authorId: userId, text, createdAt: now() });

    // Increment commentCount
    const idea = await getOne<Idea>(COL_IDEAS, ideaId) as any;
    await update(COL_IDEAS, ideaId, { commentCount: (idea?.commentCount ?? 0) + 1 });

    revalidatePath(`/ideas/${ideaId}`);
  } catch (error) {
    console.error('[addIdeaComment Error]', error);
    throw new Error('Gagal menambahkan komentar.');
  }
}

export async function getIdeaComments(ideaId: string): Promise<CommentWithAuthor[]> {
  try {
    const comments = await getAll<Record<string, unknown>>(COL_COMMENTS, {
      where: { field: 'ideaId', op: '==', value: ideaId },
      orderBy: { field: 'createdAt', direction: 'desc' },
    });

    const result: CommentWithAuthor[] = [];
    for (const c of comments) {
      const author = await getOne<Record<string, unknown>>(COL_USERS, c.authorId as string);
      if (author) {
        result.push({
          id: c.id as string,
          text: c.text as string,
          author: {
            id: c.authorId as string,
            name: (author.fullName ?? 'User') as string,
            username: (author.username ?? 'user') as string,
            avatarUrl: (author.avatarUrl ?? '') as string,
          },
          timestamp: formatTimestamp(c.createdAt as string),
        });
      }
    }
    return result;
  } catch (error) {
    console.error('[getIdeaComments Error]', error);
    throw new Error('Gagal memuat komentar.');
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getIdeaCategories(): Promise<IdeaCategory[]> {
  try {
    return await getAll<IdeaCategory>(COL_CATEGORIES, {
      orderBy: { field: 'name', direction: 'asc' },
    });
  } catch (error) {
    console.error('[getIdeaCategories Error]', error);
    throw new Error('Gagal memuat kategori ide.');
  }
}

export async function addIdeaCategory(name: string) {
  try {
    await create(COL_CATEGORIES, { name });
    revalidatePath('/panel/ideas/kategori');
  } catch (error) {
    console.error('[addIdeaCategory Error]', error);
    throw new Error('Gagal menambahkan kategori ide.');
  }
}

export async function deleteIdeaCategory(id: string) {
  try {
    await remove(COL_CATEGORIES, id);
    revalidatePath('/panel/ideas/kategori');
  } catch (error) {
    console.error('[deleteIdeaCategory Error]', error);
    throw new Error('Gagal menghapus kategori ide.');
  }
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function createChallenge(
  data: Omit<Challenge, 'id' | 'createdAt' | 'authorId' | 'deadline'> & { deadline: Date },
  authorId: string
): Promise<string> {
  try {
    const id = await create(COL_CHALLENGES, {
      ...data,
      deadline: data.deadline.toISOString(),
      authorId,
      createdAt: now(),
    });
    revalidatePath('/panel/ideas/challenges');
    revalidatePath('/ideas/challenges');
    return id;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw new Error('Gagal membuat tantangan baru.');
  }
}

export async function getChallenges(): Promise<Challenge[]> {
  try {
    return await getAll<Challenge>(COL_CHALLENGES, {
      orderBy: { field: 'deadline', direction: 'desc' },
    });
  } catch (error) {
    console.error('[getChallenges Error]', error);
    throw new Error('Gagal mengambil daftar tantangan.');
  }
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  try {
    const nowIso = new Date().toISOString();
    const all = await getAll<Challenge>(COL_CHALLENGES, {
      where: { field: 'deadline', op: '>', value: nowIso },
      orderBy: { field: 'deadline', direction: 'asc' },
    });
    return all;
  } catch (error) {
    console.error('[getActiveChallenges Error]', error);
    throw new Error('Gagal mengambil daftar tantangan aktif.');
  }
}
