
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
import type { MemberType } from './members';
import type { IdeaStatus } from '@/lib/definitions';

export type VoteType = 'up' | 'down';


export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  createdAt: Timestamp;
  status: IdeaStatus;
  upvotes: string[];
  downvotes: string[];
  voteScore: number;
  commentCount: number;
}

export interface IdeaAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  type?: MemberType;
}

export interface IdeaWithAuthor extends Omit<Idea, 'authorId' | 'upvotes' | 'downvotes'> {
  author: IdeaAuthor;
  userVote?: VoteType;
}


const ideasCollection = collection(db, 'ideas');
const usersCollection = collection(db, 'users');

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
            console.warn(`Author with ID ${ideaData.authorId} not found for idea ${ideaData.id}.`);
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

        const { upvotes, downvotes, ...restOfData } = ideaData;

        return {
          ...restOfData,
          author: author,
          userVote: userVote,
        };
    } catch (error) {
        console.error(`Error building idea ${ideaDoc.id}:`, error);
        return null;
    }
}


// Create a new idea
export async function createIdea(authorId: string, title: string, description: string, category: string): Promise<string> {
    if (!authorId) throw new Error('Pengguna tidak terautentikasi.');

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
    };
    const docRef = await addDoc(ideasCollection, newIdea);
    revalidatePath('/ideas');
    return docRef.id;
}


// Get all ideas with filters and search
export async function getIdeas(
    userId: string, 
    sortBy: 'newest' | 'top' = 'newest', 
    categoryFilter?: string, 
    searchQuery?: string
): Promise<IdeaWithAuthor[]> {

    const orderField = sortBy === 'top' ? 'voteScore' : 'createdAt';
    let q = query(ideasCollection, orderBy(orderField, 'desc'));

    if (categoryFilter && categoryFilter !== 'Semua') {
        q = query(q, where('category', '==', categoryFilter));
    }
    
    // Note: Firestore doesn't support text search on multiple fields with range/inequality filters easily.
    // A more scalable solution would use a third-party search service like Algolia or Typesense.
    // For now, we fetch then filter in memory for the search query.
    const ideasSnapshot = await getDocs(q);

    let ideasPromises = ideasSnapshot.docs.map(doc => buildIdeaWithAuthor(doc, userId));
    let ideas = (await Promise.all(ideasPromises)).filter((p): p is IdeaWithAuthor => p !== null);

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        ideas = ideas.filter(idea => idea.title.toLowerCase().includes(lowercasedQuery));
    }

    return ideas;
}

// Get a single idea by ID
export async function getIdeaById(ideaId: string, currentUserId?: string): Promise<IdeaWithAuthor | null> {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaDoc = await getDoc(ideaRef);

    if (!ideaDoc.exists()) {
        return null;
    }

    return buildIdeaWithAuthor(ideaDoc, currentUserId);
}

// Update idea status
export async function updateIdeaStatus(ideaId: string, status: IdeaStatus) {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        await updateDoc(ideaRef, { status });
        revalidatePath('/ideas');
        revalidatePath(`/ideas/${ideaId}`);
    } catch (error) {
        console.error("Error updating idea status:", error);
        throw new Error("Gagal memperbarui status ide.");
    }
}


// Toggle vote on an idea
export async function toggleVote(ideaId: string, userId: string, voteType: VoteType) {
  const ideaRef = doc(db, 'ideas', ideaId);

  try {
    await runTransaction(db, async (transaction) => {
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
    console.error("Transaction failed: ", e);
    throw new Error("Gagal memberikan suara.");
  }
}

// Add a comment to an idea
export async function addIdeaComment(ideaId: string, userId: string, text: string) {
    if (!userId) throw new Error("Pengguna tidak terautentikasi.");
    if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

    const ideaRef = doc(db, 'ideas', ideaId);
    const commentCollection = collection(ideaRef, 'comments');

    try {
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
        console.error("Error adding comment: ", error);
        throw new Error("Gagal menambahkan komentar.");
    }
}

// Get comments for an idea
export async function getIdeaComments(ideaId: string): Promise<any[]> {
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
}

// Hardcoded categories for now
export async function getIdeaCategories(): Promise<string[]> {
    return ['Semua', 'Agrikultur', 'Maritim', 'Kehutanan', 'Teknologi', 'Pemasaran', 'Komunitas', 'Lainnya'];
}
