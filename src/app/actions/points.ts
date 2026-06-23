'use server';

import { revalidatePath } from 'next/cache';
import type { RedeemableItem, Mission, RedemptionLog, PointLog, BadgeMetric } from '@/lib/definitions';
import { getAll, getOne, getFirst, create, update, remove, uploadFile, deleteFile, now } from '@/lib/db';
import { getUserByUid } from '@/app/actions/user';

const COL_ITEMS = 'redeemableItems';
const COL_MISSIONS = 'missions';
const COL_REDEMPTIONS = 'redemptionLogs';
const COL_POINT_LOGS = 'pointLogs'; // flat table with userId field

// ─── Redeemable Items ─────────────────────────────────────────────────────────

export async function getRedeemableItems(): Promise<RedeemableItem[]> {
  return await getAll<RedeemableItem>(COL_ITEMS, {
    orderBy: { field: 'pointsRequired', direction: 'asc' },
  });
}

export async function createRedeemableItem(
  data: Omit<RedeemableItem, 'id' | 'imageUrl'>,
  imageDataUri?: string
) {
  const dataToCreate: Record<string, unknown> = { ...data };
  if (imageDataUri) {
    // Convert data URI to Uint8Array for upload
    const base64 = imageDataUri.split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    dataToCreate.imageUrl = await uploadFile(buf, `redeem-items/${Date.now()}_item.jpg`);
  }
  await create(COL_ITEMS, dataToCreate);
  revalidatePath('/panel/redeem');
  revalidatePath('/points');
}

export async function updateRedeemableItem(
  id: string,
  data: Partial<Omit<RedeemableItem, 'id' | 'imageUrl'>>,
  imageDataUri?: string
) {
  const updateData: Record<string, unknown> = { ...data };
  if (imageDataUri) {
    const base64 = imageDataUri.split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    updateData.imageUrl = await uploadFile(buf, `redeem-items/${Date.now()}_${id}.jpg`);
  }
  await update(COL_ITEMS, id, updateData);
  revalidatePath('/panel/redeem');
  revalidatePath('/points');
}

export async function deleteRedeemableItem(id: string) {
  const item = await getOne<RedeemableItem>(COL_ITEMS, id);
  if (item?.imageUrl) await deleteFile(item.imageUrl);
  await remove(COL_ITEMS, id);
  revalidatePath('/panel/redeem');
  revalidatePath('/points');
}

// ─── Missions ─────────────────────────────────────────────────────────────────

export async function getMissions(): Promise<Mission[]> {
  return await getAll<Mission>(COL_MISSIONS, {
    orderBy: { field: 'name', direction: 'asc' },
  });
}

export async function createMission(data: Omit<Mission, 'id'>) {
  await create(COL_MISSIONS, data as Record<string, unknown>);
  revalidatePath('/panel/missions');
  revalidatePath('/points');
}

export async function updateMission(id: string, data: Partial<Mission>) {
  await update(COL_MISSIONS, id, data as Record<string, unknown>);
  revalidatePath('/panel/missions');
  revalidatePath('/points');
}

export async function deleteMission(id: string) {
  await remove(COL_MISSIONS, id);
  revalidatePath('/panel/missions');
  revalidatePath('/points');
}

// ─── Redemption ───────────────────────────────────────────────────────────────

export async function redeemItem(userId: string, itemId: string) {
  const [user, item] = await Promise.all([
    getOne<Record<string, unknown>>('users', userId),
    getOne<RedeemableItem>(COL_ITEMS, itemId),
  ]);

  if (!user) throw new Error('Pengguna tidak ditemukan.');
  if (!item) throw new Error('Item tidak ditemukan.');

  const userPoints = (user.greenPoints as number) ?? 0;
  if (userPoints < item.pointsRequired) throw new Error('Poin tidak mencukupi.');
  if ((item as any).stock <= 0) throw new Error('Stok item habis.');

  // Deduct points
  await update('users', userId, { greenPoints: userPoints - item.pointsRequired });
  // Decrement stock
  await update(COL_ITEMS, itemId, { stock: ((item as any).stock) - 1 });

  // Log redemption
  await create(COL_REDEMPTIONS, {
    userId,
    userName: user.fullName,
    itemId,
    itemName: item.name,
    pointsSpent: item.pointsRequired,
    redeemedAt: now(),
  });

  // Log point deduction
  await create(COL_POINT_LOGS, {
    userId,
    points: -item.pointsRequired,
    description: `Menukar item: ${item.name}`,
    createdAt: now(),
  });

  revalidatePath('/points');
  revalidatePath('/panel/redeem/history');
}

export async function getRedemptionHistory(): Promise<RedemptionLog[]> {
  return await getAll<RedemptionLog>(COL_REDEMPTIONS, {
    orderBy: { field: 'redeemedAt', direction: 'desc' },
  });
}

export async function getPointHistory(userId: string): Promise<PointLog[]> {
  try {
    return await getAll<PointLog>(COL_POINT_LOGS, {
      where: { field: 'userId', op: '==', value: userId },
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 50,
    });
  } catch (error) {
    console.error(`[getPointHistory Error] for user ${userId}:`, error);
    throw new Error('Gagal mengambil riwayat poin.');
  }
}

export async function awardPointsForAction(
  actionType: Mission['type'] | BadgeMetric,
  userId: string,
  description: string,
  level: number = 1
) {
  const filterField = actionType === 'referral' ? 'type' : 'criteria.metric';
  const mission = await getFirst<Mission>(COL_MISSIONS, {
    where: { field: filterField, op: '==', value: actionType },
  });

  if (!mission) {
    console.warn(`[awardPoints] No mission found for action type: ${actionType}.`);
    return;
  }

  let pointsToAward = 0;
  if (actionType === 'referral' && (mission as any).pointsPerLevel) {
    const lvlPoints = (mission as any).pointsPerLevel as number[];
    if (level > 0 && level <= lvlPoints.length) pointsToAward = lvlPoints[level - 1] || 0;
  } else if ((mission as any).points) {
    pointsToAward = (mission as any).points;
  }

  if (pointsToAward <= 0) {
    console.warn(`[awardPoints] No points to award for mission ${mission.name} to user ${userId}.`);
    return;
  }

  const user = await getOne<Record<string, unknown>>('users', userId);
  if (!user) throw new Error('User not found');

  const currentPoints = (user.greenPoints as number) ?? 0;
  await update('users', userId, { greenPoints: currentPoints + pointsToAward });

  await create(COL_POINT_LOGS, {
    userId,
    points: pointsToAward,
    description,
    createdAt: now(),
  });

  revalidatePath('/points');
}
