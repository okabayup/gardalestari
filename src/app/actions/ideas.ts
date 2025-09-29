

'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  Timestamp,
  orderBy,
  runTransaction,
  increment,
  startAfter,
  limit,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Idea, IdeaWithAuthor, IdeaAuthor, IdeaCategory, VoteType, IdeaStatus, IdeaType, Challenge } from '@/lib/definitions';

const ideasCollection = collection(db, 'ideas');
const usersCollection = collection(db, 'users');
const ideaCategoriesCollection = collection(db, 'ideaCategories');
const challengesCollection = collection(db, 'challenges');


const formatTimestamp = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Baru saja";
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
};


// Helper to build a IdeaWithAuthor object
const buildIdeaWithAuthor = async (ideaDoc: any, currentUserId?: string): Promise<IdeaWithAuthor | null> => {
    try {
        const ideaData = { id: ideaDoc.id, ...ideaDoc.data() } as Idea;
        const authorRef = doc(usersCollection, ideaData.authorId);
        const authorDoc = await getDoc(authorRef);
        
        if (!authorDoc.exists()) {
            console.warn(`[buildIdeaWithAuthor Warn] Author with ID ${ideaData.authorId} not found for idea ${ideaData.id}.`);
            return null;
        }
        
        const authorData = authorDoc.data();
        const author: IdeaAuthor = {
            id: ideaData.authorId,
            name: authorData?.fullName || authorData?.displayName || 'Unknown User',
            username: authorData?.username || `user_${ideaData.authorId.substring(0,5)}`,
            avatarUrl: authorData?.avatarUrl || '',
            type: authorData?.type,
        };

        let userVote: VoteType | undefined = undefined;
        if (currentUserId) {
            if (ideaData.upvotes.includes(currentUserId)) userVote = 'up';
            else if (ideaData.downvotes.includes(currentUserId)) userVote = 'down';
        }

        const { upvotes, downvotes, createdAt, ...restOfData } = ideaData;

        return {
          ...restOfData,
          createdAt: createdAt.toDate().toISOString(), // Convert Timestamp to ISO string
          author: author,
          userVote: userVote,
        };
    } catch (error) {
        console.error(`[buildIdeaWithAuthor Error] for idea ${ideaDoc.id}:`, error);
        return null;
    }
}


// Create a new idea
export async function createIdea(authorId: string, title: string, description: string, category: string, challengeId?: string): Promise<string> {
    try {
        if (!authorId) throw new Error('Pengguna tidak terautentikasi.');
        
        let challengeTitle: string | undefined = undefined;
        if (challengeId) {
            const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
            if (challengeDoc.exists()) challengeTitle = challengeDoc.data().title;
        }

        const newIdea: Omit<Idea, 'id'> = {
            title,
            description,
            category,
            authorId,
            status: 'diajukan',
            createdAt: Timestamp.now(),
            upvotes: [],
            downvotes: [],
            voteScore: 0,
            commentCount: 0,
            type: challengeId ? 'SOLUTION' : 'INNOVATIVE',
            challengeId: challengeId,
            challengeTitle: challengeTitle,
        };
        const docRef = await addDoc(ideasCollection, newIdea);
        revalidatePath('/ideas');
        return docRef.id;
    } catch (error) {
        console.error("[createIdea Error]", error);
        throw new Error("Gagal membuat ide baru.");
    }
}


// Get all ideas with filters and search
export async function getIdeas(
    userId: string, 
    sortBy: 'newest' | 'top' = 'top', 
    categoryFilter?: string, 
    searchQuery?: string
): Promise<IdeaWithAuthor[]> {
    try {
        const orderField = sortBy === 'top' ? 'voteScore' : 'createdAt';
        let q = query(ideasCollection, orderBy(orderField, 'desc'));

        if (categoryFilter && categoryFilter !== 'Semua') {
            q = query(q, where('category', '==', categoryFilter));
        }
        
        const ideasSnapshot = await getDocs(q);

        let ideasPromises = ideasSnapshot.docs.map(doc => buildIdeaWithAuthor(doc, userId));
        let ideas = (await Promise.all(ideasPromises)).filter((p): p is IdeaWithAuthor => p !== null);

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            ideas = ideas.filter(idea => 
                idea.title.toLowerCase().includes(lowercasedQuery) ||
                idea.description.toLowerCase().includes(lowercasedQuery)
            );
        }

        return ideas;
    } catch (error) {
        console.error("[getIdeas Error]", error);
        throw new Error("Gagal memuat ide.");
    }
}

/**
 * Searches the idea bank for relevant entries based on a query.
 * To be used by an AI tool.
 * @param searchQuery The keywords or question to search for.
 * @returns A list of relevant ideas.
 */
export async function searchIdeaBank(searchQuery: string): Promise<Partial<Idea>[]> {
    try {
        const q = query(
            ideasCollection,
            orderBy('voteScore', 'desc'),
            limit(50)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];

        const allEntries: Idea[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));

        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const results = allEntries.filter(entry => {
            const searchableText = `${entry.title} ${entry.description} ${entry.category}`.toLowerCase();
            return searchTerms.some(term => searchableText.includes(term));
        }).slice(0, 5); // Return top 5 matches

        return results.map(idea => ({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            category: idea.category,
            voteScore: idea.voteScore,
            commentCount: idea.commentCount,
        }));
    } catch (error) {
        console.error("[searchIdeaBank Error]", error);
        throw new Error("Gagal mencari di bank ide.");
    }
}


// Get a single idea by ID
export async function getIdeaById(ideaId: string, currentUserId?: string): Promise<IdeaWithAuthor | null> {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        const ideaDoc = await getDoc(ideaRef);

        if (!ideaDoc.exists()) {
            return null;
        }

        return buildIdeaWithAuthor(ideaDoc, currentUserId);
    } catch (error) {
        console.error("[getIdeaById Error]", error);
        throw new Error("Gagal mengambil detail ide.");
    }
}

// Update idea status
export async function updateIdeaStatus(ideaId: string, status: IdeaStatus) {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        await updateDoc(ideaRef, { status });
        revalidatePath('/ideas');
        revalidatePath(`/ideas/${ideaId}`);
    } catch (error) {
        console.error("[updateIdeaStatus Error]", error);
        throw new Error("Gagal memperbarui status ide.");
    }
}


// Toggle vote on an idea
export async function toggleVote(ideaId: string, userId: string, voteType: VoteType) {
  try {
    await runTransaction(db, async (transaction) => {
      const ideaRef = doc(db, 'ideas', ideaId);
      const ideaDoc = await transaction.get(ideaRef);
      if (!ideaDoc.exists()) {
        throw "Ide tidak ditemukan!";
      }

      const ideaData = ideaDoc.data() as Idea;
      let upvotes = ideaData.upvotes || [];
      let downvotes = ideaData.downvotes || [];
      
      const hasUpvoted = upvotes.includes(userId);
      const hasDownvoted = downvotes.includes(userId);

      if (voteType === 'up') {
        upvotes = hasUpvoted ? upvotes.filter(uid => uid !== userId) : [...upvotes, userId];
        downvotes = downvotes.filter(uid => uid !== userId);
      } else { // 'down'
        downvotes = hasDownvoted ? downvotes.filter(uid => uid !== userId) : [...downvotes, userId];
        upvotes = upvotes.filter(uid => uid !== userId);
      }
      
      const voteScore = upvotes.length - downvotes.length;

      transaction.update(ideaRef, { upvotes, downvotes, voteScore });
    });
    
    revalidatePath('/ideas');
    revalidatePath(`/ideas/${ideaId}`);

  } catch (e) {
    console.error("[toggleVote Error]", e);
    throw new Error("Gagal memberikan suara.");
  }
}

// Add a comment to an idea
export async function addIdeaComment(ideaId: string, userId: string, text: string) {
    try {
        if (!userId) throw new Error("Pengguna tidak terautentikasi.");
        if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

        const ideaRef = doc(db, 'ideas', ideaId);
        const commentCollection = collection(ideaRef, 'comments');

        const batch = writeBatch(db);

        const newCommentRef = doc(commentCollection);
        batch.set(newCommentRef, {
            authorId: userId,
            text: text,
            createdAt: Timestamp.now()
        });

        batch.update(ideaRef, { commentCount: increment(1) });
        
        await batch.commit();
        revalidatePath(`/ideas/${ideaId}`);

    } catch (error) {
        console.error("[addIdeaComment Error]", error);
        throw new Error("Gagal menambahkan komentar.");
    }
}

// Get comments for an idea
export async function getIdeaComments(ideaId: string): Promise<any[]> {
    try {
        const commentsCollection = collection(db, 'ideas', ideaId, 'comments');
        const q = query(commentsCollection, orderBy('createdAt', 'desc'));

        const commentsSnapshot = await getDocs(q);
        const comments = [];

        for (const commentDoc of commentsSnapshot.docs) {
            const commentData = { id: commentDoc.id, ...commentDoc.data() };
            const authorDoc = await getDoc(doc(usersCollection, commentData.authorId));
            if (authorDoc.exists()) {
                const authorData = authorDoc.data();
                comments.push({
                    ...commentData,
                    author: {
                        name: authorData.fullName || 'User',
                        username: authorData.username || 'user',
                        avatarUrl: authorData.avatarUrl || ''
                    },
                    timestamp: formatTimestamp(commentData.createdAt)
                });
            }
        }
        return comments;
    } catch (error) {
        console.error("[getIdeaComments Error]", error);
        throw new Error("Gagal memuat komentar.");
    }
}

// --- Category Management ---

// Get all idea categories
export async function getIdeaCategories(): Promise<IdeaCategory[]> {
    try {
        const q = query(ideaCategoriesCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const categories: IdeaCategory[] = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() } as IdeaCategory);
        });
        return categories;
    } catch (error) {
        console.error("[getIdeaCategories Error]", error);
        throw new Error("Gagal memuat kategori ide.");
    }
}

// Add a new idea category
export async function addIdeaCategory(name: string) {
    try {
        await addDoc(ideaCategoriesCollection, { name });
        revalidatePath('/panel/ideas/kategori');
    } catch (error) {
        console.error("[addIdeaCategory Error]", error);
        throw new Error("Gagal menambahkan kategori ide.");
    }
}

// Delete an idea category
export async function deleteIdeaCategory(id: string) {
    try {
        const categoryDoc = doc(db, 'ideaCategories', id);
        await deleteDoc(categoryDoc);
        revalidatePath('/panel/ideas/kategori');
    } catch (error) {
        console.error("[deleteIdeaCategory Error]", error);
        throw new Error("Gagal menghapus kategori ide.");
    }
}

// --- Challenge Management ---
export async function getActiveChallenges(): Promise<Challenge[]> {
    try {
        const now = Timestamp.now();
        const q = query(challengesCollection, where('deadline', '>', now), orderBy('deadline', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
    } catch (error) {
        console.error("[getActiveChallenges Error]", error);
        throw new Error("Gagal mengambil daftar tantangan aktif.");
    }
}
