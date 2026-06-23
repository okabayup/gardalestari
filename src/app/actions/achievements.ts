'use server';

import { revalidatePath } from 'next/cache';
export type { Achievement } from '@/lib/definitions';
import type { Achievement } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile, deleteFile, getAuthUser } from '@/lib/db';
import { checkAndAwardBadges } from '@/app/actions/badges';

const COL = 'achievements';

// ─── Public Functions for AI Tool ────────────────────────────────────────────

export async function searchAchievements(searchQuery: string): Promise<Partial<Achievement>[]> {
  try {
    const allEntries = await getAll<Achievement>(COL, {
      orderBy: { field: 'date', direction: 'desc' },
      limit: 20,
    });

    const searchTerms = searchQuery.toLowerCase().split(' ');
    const results = allEntries
      .filter(entry => {
        const text = `${entry.title} ${entry.description} ${entry.userName}`.toLowerCase();
        return searchTerms.some(term => text.includes(term));
      })
      .slice(0, 5);

    return results.map(({ id, title, userName, date }) => ({ id, title, userName, date }));
  } catch (error) {
    console.error('[searchAchievements Error]', error);
    throw new Error('Gagal mencari data prestasi.');
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getAchievements(): Promise<Achievement[]> {
  try {
    return await getAll<Achievement>(COL, {
      orderBy: { field: 'date', direction: 'desc' },
    });
  } catch (error) {
    console.error('[getAchievements Error]', error);
    throw new Error('Gagal mengambil data prestasi.');
  }
}

export async function getAchievementsByUserId(userId: string): Promise<Achievement[]> {
  try {
    const results = await getAll<Achievement>(COL, {
      where: { field: 'userId', op: '==', value: userId },
    });
    return results.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('[getAchievementsByUserId Error]', error);
    throw new Error('Gagal mengambil data prestasi pengguna.');
  }
}

export async function getAchievement(id: string): Promise<Achievement | null> {
  try {
    return await getOne<Achievement>(COL, id);
  } catch (error) {
    console.error('[getAchievement Error]', error);
    throw new Error('Gagal mengambil data prestasi tunggal.');
  }
}

export async function createAchievement(
  data: Omit<Achievement, 'id' | 'date'> & { date: string | Date },
  imageFile?: File
) {
  try {
    const achievementData: Record<string, unknown> = {
      ...data,
      date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString(),
    };
    if (imageFile) {
      achievementData.imageUrl = await uploadFile(
        imageFile,
        `achievements/${Date.now()}_${imageFile.name}`
      );
    }
    await create(COL, achievementData);
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
    await checkAndAwardBadges(data.userId, 'achievement_added');
  } catch (error) {
    console.error('[createAchievement Error]', error);
    throw new Error(`Gagal membuat data prestasi: ${(error as Error).message}`);
  }
}

export async function createMyAchievement(
  data: Omit<Achievement, 'id' | 'userId' | 'userName' | 'userAvatar' | 'date'> & {
    date: string | Date;
  },
  userId: string,
  imageFile?: File
) {
  try {
    const user = await getAuthUser(userId);
    if (!user) throw new Error('User not found.');

    const achievementData: Record<string, unknown> = {
      ...data,
      date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString(),
      userId: user.id,
      userName: user.user_metadata?.full_name ?? user.email ?? 'Pengguna',
      userAvatar: user.user_metadata?.avatar_url ?? '',
    };

    if (imageFile) {
      achievementData.imageUrl = await uploadFile(
        imageFile,
        `achievements/${Date.now()}_${imageFile.name}`
      );
    }

    await create(COL, achievementData);
    revalidatePath('/achievements');
    revalidatePath('/profile/me');
    await checkAndAwardBadges(userId, 'achievement_added');
  } catch (error) {
    console.error('[createMyAchievement Error]', error);
    throw new Error(`Gagal menambahkan prestasi Anda: ${(error as Error).message}`);
  }
}

export async function updateAchievement(
  id: string,
  data: Partial<Omit<Achievement, 'id' | 'date'>> & { date?: string | Date },
  imageFile?: File
) {
  try {
    const dataToUpdate: Record<string, unknown> = { ...data };
    if (data.date !== undefined) {
      dataToUpdate.date =
        typeof data.date === 'string' ? data.date : (data.date as Date).toISOString();
    }

    if (imageFile) {
      const current = await getOne<Achievement>(COL, id);
      if (current?.imageUrl) await deleteFile(current.imageUrl);
      dataToUpdate.imageUrl = await uploadFile(
        imageFile,
        `achievements/${Date.now()}_${imageFile.name}`
      );
    }

    await update(COL, id, dataToUpdate);
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error('[updateAchievement Error]', error);
    throw new Error(`Gagal memperbarui prestasi: ${(error as Error).message}`);
  }
}

export async function deleteAchievement(id: string) {
  try {
    const doc = await getOne<Achievement>(COL, id);
    if (doc?.imageUrl) await deleteFile(doc.imageUrl);
    await remove(COL, id);
    revalidatePath('/panel/achievements');
    revalidatePath('/achievements');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error('[deleteAchievement Error]', error);
    throw new Error('Gagal menghapus prestasi.');
  }
}
