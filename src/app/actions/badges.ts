'use server';

import { revalidatePath } from 'next/cache';
import type { Badge, BadgeMetric, Mission } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, count, now } from '@/lib/db';
import { getUserByUid } from '@/app/actions/user';
import { awardPointsForAction } from '@/app/actions/points';

const COL_BADGES = 'badges';
const COL_MISSIONS = 'missions';

export async function getBadges(): Promise<Badge[]> {
  try {
    return await getAll<Badge>(COL_BADGES, {
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
  } catch (error) {
    console.error('[getBadges Error]', error);
    throw new Error('Gagal mengambil data lencana.');
  }
}

export async function createBadge(data: Omit<Badge, 'id' | 'createdAt'>) {
  try {
    await create(COL_BADGES, { ...data, createdAt: now() });
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error('[createBadge Error]', error);
    throw new Error(`Gagal membuat lencana: ${(error as Error).message}`);
  }
}

export async function updateBadge(id: string, data: Partial<Omit<Badge, 'id' | 'createdAt'>>) {
  try {
    await update(COL_BADGES, id, data as Record<string, unknown>);
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error('[updateBadge Error]', error);
    throw new Error(`Gagal memperbarui lencana: ${(error as Error).message}`);
  }
}

export async function deleteBadge(id: string) {
  try {
    await remove(COL_BADGES, id);
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error('[deleteBadge Error]', error);
    throw new Error('Gagal menghapus lencana.');
  }
}

// Helper: add/remove item from array field in user document
async function updateUserBadgeArray(userId: string, badgeId: string, action: 'add' | 'remove') {
  const user = await getOne<Record<string, unknown>>('users', userId);
  if (!user) throw new Error(`User ${userId} not found`);
  const arr = (user.assignedBadges as string[] | undefined) ?? [];
  const updated =
    action === 'add'
      ? arr.includes(badgeId) ? arr : [...arr, badgeId]
      : arr.filter(id => id !== badgeId);
  await update('users', userId, { assignedBadges: updated });
}

export async function assignBadgeToUser(userId: string, badgeId: string) {
  try {
    await updateUserBadgeArray(userId, badgeId, 'add');
    revalidatePath(`/profile/me`);
    revalidatePath(`/profile/${userId}`);
  } catch (error) {
    console.error('[assignBadgeToUser Error]', error);
    throw new Error('Gagal memberikan lencana.');
  }
}

export async function removeBadgeFromUser(userId: string, badgeId: string) {
  try {
    await updateUserBadgeArray(userId, badgeId, 'remove');
    revalidatePath(`/profile/me`);
    revalidatePath(`/profile/${userId}`);
  } catch (error) {
    console.error('[removeBadgeFromUser Error]', error);
    throw new Error('Gagal mencabut lencana.');
  }
}

// ─── Metric calculation ───────────────────────────────────────────────────────

async function getUserMetric(userId: string, metric: BadgeMetric): Promise<number> {
  switch (metric) {
    case 'post_count':
      return await count('posts', { where: { field: 'authorId', op: '==', value: userId } });
    case 'idea_count':
      return await count('ideas', { where: { field: 'authorId', op: '==', value: userId } });
    case 'achievement_added':
      return await count('achievements', { where: { field: 'userId', op: '==', value: userId } });
    case 'vote_casted':
    case 'comment_count':
    case 'upvote_count':
    case 'project_completed':
    default:
      return 0;
  }
}

export async function checkAndAwardBadges(userId: string, triggeredMetric: BadgeMetric) {
  console.log(`[checkAndAwardBadges] user: ${userId}, metric: ${triggeredMetric}`);
  try {
    const user = await getUserByUid(userId);
    if (!user) throw new Error('User not found');

    const userValue = await getUserMetric(userId, triggeredMetric);

    // Badge awarding
    const autoBadges = await getAll<Badge>(COL_BADGES, {
      where: [
        { field: 'type', op: '==', value: 'auto' },
        { field: 'criteria.metric', op: '==', value: triggeredMetric },
      ],
    });
    const userAssignedBadges = (user.assignedBadges as string[]) || [];

    for (const badge of autoBadges) {
      if (!badge.id || !badge.criteria) continue;
      if (userAssignedBadges.includes(badge.id)) continue;
      if (userValue >= (badge.criteria as { value: number }).value) {
        console.log(`[checkAndAwardBadges] Awarding badge '${badge.name}' to ${userId}`);
        await assignBadgeToUser(userId, badge.id);
      }
    }

    // Mission point awarding
    const autoMissions = await getAll<Mission>(COL_MISSIONS, {
      where: [
        { field: 'type', op: '==', value: 'auto' },
        { field: 'criteria.metric', op: '==', value: triggeredMetric },
      ],
    });

    for (const mission of autoMissions) {
      if (!mission.id || !mission.criteria || !(mission as any).points) continue;
      const target = ((mission as any).criteria as { value: number }).value;
      if (userValue > 0 && userValue % target === 0) {
        await awardPointsForAction(triggeredMetric, userId, `Menyelesaikan Misi: ${mission.name}`);
      }
    }
  } catch (error) {
    console.error(`[checkAndAwardBadges] Error for user ${userId}:`, error);
  }
}
