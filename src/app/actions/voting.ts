
'use server';

import { db, storage } from '@/lib/firebase';
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { VotingTopic, VotingOption, UpdateVotingTopicPayload, VotingTopicDTO } from '@/lib/definitions';

const votingCollection = collection(db, 'votingTopics');
const usersCollection = collection(db, 'users');

// --- Admin Actions ---

export async function createVotingTopic(
  data: Omit<UpdateVotingTopicPayload, 'options'>, 
  options: { name: string; imageFile?: File }[],
  coverImageFile?: File
) {
  try {
    let coverImageUrl: string | undefined = undefined;
    if (coverImageFile) {
        const coverImageRef = ref(storage, `evoting/covers/${Date.now()}_${coverImageFile.name}`);
        await uploadBytes(coverImageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(coverImageRef);
    }
    
    const optionsWithDetails: VotingOption[] = await Promise.all(options.map(async (opt, index) => {
        let imageUrl: string | undefined = undefined;
        if (opt.imageFile) {
            const optionImageRef = ref(storage, `evoting/options/${Date.now()}_${index}_${opt.imageFile.name}`);
            await uploadBytes(optionImageRef, opt.imageFile);
            imageUrl = await getDownloadURL(optionImageRef);
        }
        return {
            id: `option-${index + 1}-${Date.now()}`,
            name: opt.name,
            voteCount: 0,
            imageUrl: imageUrl
        };
    }));
    
    const newTopic = {
        ...data,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        options: optionsWithDetails,
        coverImageUrl,
        totalVotes: 0,
        voterIds: [],
        createdAt: Timestamp.now(),
    };

    await addDoc(votingCollection, newTopic);
    revalidatePath('/panel/evoting');
    revalidatePath('/evoting');
  } catch (error) {
    console.error('Error creating voting topic:', error);
    throw new Error('Gagal membuat topik E-Voting.');
  }
}

export async function updateVotingTopic(
    id: string, 
    data: UpdateVotingTopicPayload,
    newOptions: { name: string; imageFile?: File; existingImageUrl?: string; id: string; voteCount: number }[],
    coverImageFile?: File
) {
    try {
        const topicRef = doc(db, 'votingTopics', id);

        const dataToUpdate: { [key: string]: any } = {
            ...data,
            startDate: Timestamp.fromDate(data.startDate),
            endDate: Timestamp.fromDate(data.endDate),
        };
        
        if (coverImageFile) {
            const coverImageRef = ref(storage, `evoting/covers/${Date.now()}_${coverImageFile.name}`);
            await uploadBytes(coverImageRef, coverImageFile);
            dataToUpdate.coverImageUrl = await getDownloadURL(coverImageRef);
        } else if (data.coverImageUrl === undefined) {
             dataToUpdate.coverImageUrl = null;
        }

        const updatedOptions = await Promise.all(newOptions.map(async (opt, index) => {
            let imageUrl = opt.existingImageUrl;
            if (opt.imageFile) {
                const optionImageRef = ref(storage, `evoting/options/${id}_${index}_${opt.imageFile.name}`);
                await uploadBytes(optionImageRef, opt.imageFile);
                imageUrl = await getDownloadURL(optionImageRef);
            }
             return {
                id: opt.id,
                name: opt.name,
                voteCount: opt.voteCount,
                imageUrl: imageUrl
            };
        }));
        
        dataToUpdate.options = updatedOptions;

        await updateDoc(topicRef, dataToUpdate);

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
    // TODO: Delete images from storage
    revalidatePath('/panel/evoting');
    revalidatePath('/evoting');
  } catch (error) {
    console.error('Error deleting voting topic:', error);
    throw new Error('Gagal menghapus topik E-Voting.');
  }
}

// Helper function to safely convert a Firestore Timestamp or a JS Date to an ISO string.
const toISOStringSafe = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (date.toDate) return date.toDate().toISOString(); // Firestore Timestamp
  if (date instanceof Date) return date.toISOString(); // JavaScript Date
  
  // Check if the date string is valid before creating a new Date
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  // Fallback for invalid dates
  return new Date().toISOString();
}

// This function returns a DTO to be safely used by client components
export async function getVotingTopics(): Promise<VotingTopicDTO[]> {
  const q = query(votingCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data.title,
        description: data.description,
        options: data.options,
        voterIds: data.voterIds,
        totalVotes: data.totalVotes,
        startDate: toISOStringSafe(data.startDate),
        endDate: toISOStringSafe(data.endDate),
        createdAt: toISOStringSafe(data.createdAt),
        coverImageUrl: data.coverImageUrl,
    }
  });
}

// This function returns a DTO to be safely used by client components
export async function getVotingTopic(id: string): Promise<VotingTopicDTO | null> {
  const docRef = doc(db, 'votingTopics', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    description: data.description,
    options: data.options,
    voterIds: data.voterIds,
    totalVotes: data.totalVotes,
    startDate: toISOStringSafe(data.startDate),
    endDate: toISOStringSafe(data.endDate),
    createdAt: toISOStringSafe(data.createdAt),
    coverImageUrl: data.coverImageUrl
  };
}


// --- User Actions ---

export async function castVote(topicId: string, optionId: string, userId: string) {
  try {
    await runTransaction(db, async (transaction) => {
      const topicRef = doc(db, 'votingTopics', topicId);
      const userRef = doc(db, 'users', userId);
      
      const [topicDoc, userDoc] = await Promise.all([
          transaction.get(topicRef),
          transaction.get(userRef)
      ]);

      if (!topicDoc.exists()) {
        throw new Error('Topik voting tidak ditemukan.');
      }
      if (!userDoc.exists()) {
        throw new Error('Pengguna tidak ditemukan.');
      }

      const topicData = topicDoc.data() as VotingTopic;
      const userData = userDoc.data();

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
      let voteWeight = 1;
      const isSpecialMember = userData.isSpecialMember === true;

      if (isSpecialMember) {
          const voterInfoPromises = topicData.voterIds.map(vId => transaction.get(doc(usersCollection, vId)));
          const voterDocs = await Promise.all(voterInfoPromises);
          
          const regularVotersCount = voterDocs.filter(vDoc => vDoc.exists() && vDoc.data()?.isSpecialMember !== true).length;
          const specialVotersCount = voterDocs.filter(vDoc => vDoc.exists() && vDoc.data()?.isSpecialMember === true).length;
          
          const totalRegularVotesWeight = Math.ceil(regularVotersCount * 0.25);
          const newSpecialVoterCount = specialVotersCount + 1; // including the current voter

          voteWeight = totalRegularVotesWeight > 0 
              ? Math.max(1, Math.floor(totalRegularVotesWeight / newSpecialVoterCount))
              : 5; // Fallback weight if no regular members have voted yet
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
  } catch (error) {
    console.error("Error casting vote:", error);
    throw new Error((error as Error).message);
  }
}
