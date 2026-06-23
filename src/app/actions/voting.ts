'use server';

import { revalidatePath } from 'next/cache';
import type { VotingTopic, VotingOption, UpdateVotingTopicPayload, VotingTopicDTO } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile, now } from '@/lib/db';
import { checkAndAwardBadges } from './badges';

const COL = 'votingTopics';
const COL_USERS = 'users';

// Helper: safely convert any date value to ISO string
const toISOStringSafe = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  if (date instanceof Date) return date.toISOString();
  if (date.toDate) return date.toDate().toISOString(); // Firestore Timestamp (migrated data)
  return new Date().toISOString();
};

// --- Admin Actions ---

export async function createVotingTopic(
  data: Omit<UpdateVotingTopicPayload, 'options'>,
  options: { name: string; imageFile?: File }[],
  coverImageFile?: File
) {
  try {
    let coverImageUrl: string | undefined = undefined;
    if (coverImageFile) {
      coverImageUrl = await uploadFile(coverImageFile, `evoting/covers/${Date.now()}_${coverImageFile.name}`);
    }

    const optionsWithDetails: VotingOption[] = await Promise.all(
      options.map(async (opt, index) => {
        let imageUrl: string | undefined = undefined;
        if (opt.imageFile) {
          imageUrl = await uploadFile(opt.imageFile, `evoting/options/${Date.now()}_${index}_${opt.imageFile.name}`);
        }
        return {
          id: `option-${index + 1}-${Date.now()}`,
          name: opt.name,
          voteCount: 0,
          imageUrl,
        };
      })
    );

    const newTopic = {
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
      endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
      options: optionsWithDetails,
      coverImageUrl,
      totalVotes: 0,
      voterIds: [],
      createdAt: now(),
    };

    await create(COL, newTopic as Record<string, unknown>);
    revalidatePath('/panel/evoting');
    revalidatePath('/evoting');
  } catch (error) {
    console.error('Error creating voting topic:', error);
    throw new Error(`Gagal membuat topik E-Voting: ${(error as Error).message}`);
  }
}

export async function updateVotingTopic(
  id: string,
  data: UpdateVotingTopicPayload,
  newOptions: { name: string; imageFile?: File; existingImageUrl?: string; id: string; voteCount: number }[],
  coverImageFile?: File
) {
  try {
    const dataToUpdate: Record<string, any> = {
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
      endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
    };

    if (coverImageFile) {
      dataToUpdate.coverImageUrl = await uploadFile(coverImageFile, `evoting/covers/${Date.now()}_${coverImageFile.name}`);
    } else if (data.coverImageUrl === undefined) {
      dataToUpdate.coverImageUrl = null;
    }

    const updatedOptions = await Promise.all(
      newOptions.map(async (opt, index) => {
        let imageUrl = opt.existingImageUrl;
        if (opt.imageFile) {
          imageUrl = await uploadFile(opt.imageFile, `evoting/options/${id}_${index}_${opt.imageFile.name}`);
        }
        return { id: opt.id, name: opt.name, voteCount: opt.voteCount, imageUrl };
      })
    );

    dataToUpdate.options = updatedOptions;
    await update(COL, id, dataToUpdate);

    revalidatePath('/panel/evoting');
    revalidatePath(`/evoting/${id}`);
  } catch (error) {
    console.error('Error updating voting topic:', error);
    throw new Error(`Gagal memperbarui topik E-Voting: ${(error as Error).message}`);
  }
}

export async function deleteVotingTopic(id: string) {
  try {
    await remove(COL, id);
    // TODO: Delete images from storage
    revalidatePath('/panel/evoting');
    revalidatePath('/evoting');
  } catch (error) {
    console.error('Error deleting voting topic:', error);
    throw new Error('Gagal menghapus topik E-Voting.');
  }
}

export async function getVotingTopics(): Promise<VotingTopicDTO[]> {
  const rows = await getAll<any>(COL, { orderBy: { field: 'createdAt', direction: 'desc' } });
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    options: row.options,
    voterIds: row.voterIds,
    totalVotes: row.totalVotes,
    startDate: toISOStringSafe(row.startDate),
    endDate: toISOStringSafe(row.endDate),
    createdAt: toISOStringSafe(row.createdAt),
    coverImageUrl: row.coverImageUrl,
  }));
}

export async function getVotingTopic(id: string): Promise<VotingTopicDTO | null> {
  const row = await getOne<any>(COL, id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    options: row.options,
    voterIds: row.voterIds,
    totalVotes: row.totalVotes,
    startDate: toISOStringSafe(row.startDate),
    endDate: toISOStringSafe(row.endDate),
    createdAt: toISOStringSafe(row.createdAt),
    coverImageUrl: row.coverImageUrl,
  };
}

// --- User Actions ---

export async function castVote(topicId: string, optionId: string, userId: string) {
  try {
    // Sequential read-modify-write (replaces Firebase transaction)
    const topicData = await getOne<any>(COL, topicId);
    const userData = await getOne<any>(COL_USERS, userId);

    if (!topicData) throw new Error('Topik voting tidak ditemukan.');
    if (!userData) throw new Error('Pengguna tidak ditemukan.');

    if ((topicData.voterIds || []).includes(userId)) {
      throw new Error('Anda sudah memberikan suara untuk topik ini.');
    }

    const nowIso = new Date().toISOString();
    if (nowIso < toISOStringSafe(topicData.startDate) || nowIso > toISOStringSafe(topicData.endDate)) {
      throw new Error('Periode voting untuk topik ini sudah berakhir atau belum dimulai.');
    }

    // --- Weighted Vote Logic ---
    let voteWeight = 1;
    const isSpecialMember = userData.isSpecialMember === true;

    if (isSpecialMember) {
      const voterIds: string[] = topicData.voterIds || [];
      const voterDocs = await Promise.all(voterIds.map(vId => getOne<any>(COL_USERS, vId)));
      const regularVotersCount = voterDocs.filter(v => v && v.isSpecialMember !== true).length;
      const specialVotersCount = voterDocs.filter(v => v && v.isSpecialMember === true).length;

      const totalRegularVotesWeight = Math.ceil(regularVotersCount * 0.25);
      const newSpecialVoterCount = specialVotersCount + 1;

      voteWeight = totalRegularVotesWeight > 0
        ? Math.max(1, Math.floor(totalRegularVotesWeight / newSpecialVoterCount))
        : 5;
    }

    const newOptions = (topicData.options || []).map((opt: VotingOption) => {
      if (opt.id === optionId) {
        return { ...opt, voteCount: opt.voteCount + voteWeight };
      }
      return opt;
    });

    await update(COL, topicId, {
      options: newOptions,
      voterIds: [...(topicData.voterIds || []), userId],
      totalVotes: (topicData.totalVotes || 0) + voteWeight,
    });

    await checkAndAwardBadges(userId, 'vote_casted');
    revalidatePath(`/evoting/${topicId}`);
  } catch (error) {
    console.error("Error casting vote:", error);
    throw new Error((error as Error).message);
  }
}
