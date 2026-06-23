'use server';

import type { MemberType, AppNotification } from '@/lib/definitions';
import { getAll, getOne, getFirst, create, update, count, now } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

// NOTE: Firebase Cloud Messaging (push notifications) has been disabled.
// Web push via Supabase Realtime or a separate push service can be added later.
// For now, notifications are stored in DB and read by clients polling.

const COL_SUBSCRIPTIONS = 'pushSubscriptions';
const COL_NOTIFICATIONS = 'notifications';
const COL_USERS = 'users';

export async function saveSubscription(userId: string, token: string) {
  if (!userId || !token) throw new Error('User ID and token are required.');
  try {
    const existing = await getFirst(COL_SUBSCRIPTIONS, {
      where: { field: 'token', op: '==', value: token },
    }) as any;

    if (!existing) {
      await create(COL_SUBSCRIPTIONS, { userId, token, createdAt: now() });
    } else if (existing.userId !== userId) {
      await update(COL_SUBSCRIPTIONS, existing.id, { userId, updatedAt: now() });
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw new Error('Failed to save subscription on the server.');
  }
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  link?: string;
}

interface NotificationTarget {
  type: 'all' | 'users' | 'memberType';
  userIds?: string[];
  memberType?: MemberType;
}

export async function sendNotification(
  payload: NotificationPayload,
  target: NotificationTarget
) {
  try {
    let targetUserIds: string[] = [];

    if (target.type === 'all') {
      const users = await getAll<{ id: string }>(COL_USERS);
      targetUserIds = users.map(u => u.id as unknown as string);
    } else if (target.type === 'memberType' && target.memberType) {
      const users = await getAll<{ id: string }>(COL_USERS, {
        where: { field: 'type', op: '==', value: target.memberType },
      });
      targetUserIds = users.map(u => u.id as unknown as string);
    } else if (target.type === 'users' && target.userIds?.length) {
      targetUserIds = target.userIds;
    }

    if (targetUserIds.length === 0) {
      return { successCount: 0, failureCount: 0, message: 'Tidak ada pengguna target.' };
    }

    // Create in-app notifications for each user
    await Promise.all(
      targetUserIds.map(userId =>
        create(COL_NOTIFICATIONS, {
          userId,
          title: payload.title,
          body: payload.body,
          link: payload.link || '/',
          read: false,
          createdAt: now(),
        })
      )
    );

    // NOTE: FCM push not implemented. Add web push here if needed.

    return {
      successCount: targetUserIds.length,
      failureCount: 0,
      message: `Disimpan untuk ${targetUserIds.length} pengguna.`,
    };
  } catch (error: any) {
    console.error('Error sending notification:', error);
    throw new Error('Gagal mengirim notifikasi: ' + error.message);
  }
}

export async function getNotificationsForUser(userId: string): Promise<AppNotification[]> {
  try {
    return await getAll<AppNotification>(COL_NOTIFICATIONS, {
      where: { field: 'userId', op: '==', value: userId },
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 20,
    });
  } catch (error) {
    console.error('Error getting notifications for user:', error);
    throw new Error('Gagal mengambil notifikasi.');
  }
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
  try {
    if (notificationIds.length === 0) return;
    await Promise.all(notificationIds.map(id => update(COL_NOTIFICATIONS, id, { read: true })));
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw new Error('Gagal menandai notifikasi sebagai telah dibaca.');
  }
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    return await count(COL_NOTIFICATIONS, {
      where: [
        { field: 'userId', op: '==', value: userId },
        { field: 'read', op: '==', value: false },
      ],
    });
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return 0;
  }
}
