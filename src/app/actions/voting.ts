
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
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { MemberType } from './members';

export interface VotingOption {
  id: string;
  name: string;
  voteCount: number;
}

export interface VotingTopic {
  id?: string;
  title: string;
  description: string;
  options: VotingOption[];
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  totalVotes: number;
  voterIds: string[];
}

const votingCollection = collection(db, 'votingTopics');

// --- Admin Actions ---

export async function createVotingTopic(data: Omit<VotingTopic, 'id' | 'createdAt' | 'voterIds' | 'totalVotes'>) {
  try {
    await addDoc(votingCollection, {
      ...data,
      totalVotes: 0,
      voterIds: [],
      createdAt: Timestamp.now(),
    });
    revalidatePath('/panel/evoting');
    revalidatePath('/evoting');
  } catch (error) {
    console.error('Error creating voting topic:', error);
    throw new Error('Gagal membuat topik E-Voting.');
  }
}

export async function updateVotingTopic(id: string, data: Partial<Omit<VotingTopic, 'id'>>) {
    try {
        const topicRef = doc(db, 'votingTopics', id);
        await updateDoc(topicRef, data);
        revalidatePath('/panel/evoting');
        revalidatePath(`/evoting/${id}`);
    } catch (error) {
        console.error('Error updating voting topic:', error);
        throw new Error('Gagal memperbarui topik E-Voting.');
    }
}


export async function deleteVotingTopic(id: string) {
  try {
    await deleteDoc(doc(db, 'votingTopics', id));
    // TODO: Delete subcollection of votes if any
    revalidatePath('/panel/evoting');
    revalidatePath('/evoting');
  } catch (error) {
    console.error('Error deleting voting topic:', error);
    throw new Error('Gagal menghapus topik E-Voting.');
  }
}

export async function getVotingTopics(): Promise<VotingTopic[]> {
  const q = query(votingCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VotingTopic));
}

export async function getVotingTopic(id: string): Promise<VotingTopic | null> {
  const docRef = doc(db, 'votingTopics', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as VotingTopic) : null;
}

// --- User Actions ---

export async function castVote(topicId: string, optionId: string, userId: string, userType?: MemberType) {
  
  await runTransaction(db, async (transaction) => {
    const topicRef = doc(db, 'votingTopics', topicId);
    const topicDoc = await transaction.get(topicRef);
    if (!topicDoc.exists()) {
      throw new Error('Topik voting tidak ditemukan.');
    }

    const topicData = topicDoc.data() as VotingTopic;

    // Check if user has already voted
    if (topicData.voterIds.includes(userId)) {
      throw new Error('Anda sudah memberikan suara untuk topik ini.');
    }

    // Check if voting is active
    const now = Timestamp.now();
    if (now < topicData.startDate || now > topicData.endDate) {
        throw new Error('Periode voting untuk topik ini sudah berakhir atau belum dimulai.');
    }
    
    // --- Weighted Vote Logic ---
    let voteWeight = 1; // Default for regular members
    if (userType === 'pembina') { // 'pembina' is our "anggota istimewa"
        const regularVoters = topicData.voterIds.length; // Before this vote
        // Calculate the base for 25% - total regular votes so far
        const specialVoteTotalWeight = Math.ceil(regularVoters * 0.25);
        
        // Find how many special members have voted so far
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('type', '==', 'pembina'), where('__name__', 'in', topicData.voterIds.length > 0 ? topicData.voterIds : ['dummy-id-for-empty-array']));
        const specialVotersSnapshot = await getDocs(q);
        const specialVoterCount = specialVotersSnapshot.size + 1; // Including the current voter
        
        voteWeight = specialVoteTotalWeight > 0 ? Math.max(1, Math.floor(specialVoteTotalWeight / specialVoterCount)) : 5; // Use 5 as a base if no regular votes yet
    }

    // Update vote counts
    const newOptions = topicData.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, voteCount: opt.voteCount + voteWeight };
      }
      return opt;
    });

    transaction.update(topicRef, {
      options: newOptions,
      voterIds: [...topicData.voterIds, userId],
      totalVotes: topicData.totalVotes + voteWeight,
    });
  });

  revalidatePath(`/evoting/${topicId}`);
}
