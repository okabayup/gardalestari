
'use server';

import { db } from '@/lib/firebase';
import { getMessaging } from 'firebase-admin/messaging';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, documentId, FieldPath } from 'firebase/firestore';
import { initializeAdminApp } from '@/lib/firebase-admin';
import type { MemberType } from './members';

export interface PushSubscription {
  userId: string;
  token: string;
  createdAt: any;
}

const subscriptionsCollection = collection(db, 'pushSubscriptions');
const usersCollection = collection(db, 'users');

/**
 * Saves a new push notification subscription token for a user.
 * If the token already exists for the user, it does nothing.
 * If the token exists for a different user, it reassigns it to the new user.
 * @param userId - The ID of the user.
 * @param token - The push subscription token from the client.
 */
export async function saveSubscription(userId: string, token: string) {
  if (!userId || !token) {
    throw new Error('User ID and token are required.');
  }

  try {
    // Check if this token already exists
    const q = query(subscriptionsCollection, where('token', '==', token));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Token doesn't exist, create new subscription
      await addDoc(subscriptionsCollection, {
        userId,
        token,
        createdAt: serverTimestamp(),
      });
    } else {
      // Token exists, check if it belongs to the current user
      const doc = querySnapshot.docs[0];
      if (doc.data().userId !== userId) {
        // Token is registered to another user, update it to the current user
        await updateDoc(doc.ref, {
          userId,
          updatedAt: serverTimestamp(),
        });
      }
      // If it already belongs to the current user, do nothing.
    }
    
    // No revalidation needed as this is a background task.
    return { success: true };

  } catch (error) {
    console.error("Error saving subscription:", error);
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

export async function sendNotification(payload: NotificationPayload, target: NotificationTarget) {
    try {
        await initializeAdminApp();
        let targetUserIds: string[] = [];

        // Determine the target user IDs based on the strategy
        if (target.type === 'memberType' && target.memberType) {
            const usersQuery = query(usersCollection, where('type', '==', target.memberType));
            const usersSnapshot = await getDocs(usersQuery);
            targetUserIds = usersSnapshot.docs.map(doc => doc.id);
        } else if (target.type === 'users' && target.userIds && target.userIds.length > 0) {
            targetUserIds = target.userIds;
        }

        // Fetch tokens based on the determined user IDs or fetch all if target is 'all'
        let tokensQuery;
        if (target.type === 'all') {
            tokensQuery = query(subscriptionsCollection);
        } else if (targetUserIds.length > 0) {
            // Firestore 'in' query is limited to 30 items. If more, we need to batch.
            // For now, assuming we won't target more than 30 specific users at once.
             if (targetUserIds.length > 30) {
                console.warn("Targeting more than 30 specific users, this might fail. Consider batching.");
            }
            tokensQuery = query(subscriptionsCollection, where('userId', 'in', targetUserIds));
        } else if (target.type !== 'all') {
            // If target is specific but no IDs are found/provided
             return { successCount: 0, failureCount: 0, message: "Tidak ada pengguna target yang cocok dengan kriteria." };
        }

        const subscriptionsSnapshot = await getDocs(tokensQuery);
        const tokens = subscriptionsSnapshot.docs.map(doc => doc.data().token);

        if (tokens.length === 0) {
            return { successCount: 0, failureCount: 0, message: "Tidak ada pengguna yang terdaftar untuk notifikasi pada target ini." };
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            webpush: {
                notification: {
                    icon: payload.icon || '/icon-192x192.png',
                },
                fcm_options: {
                    link: payload.link || '/',
                },
            },
            tokens: tokens,
        };

        const response = await getMessaging().sendEachForMulticast(message);
        console.log(`Successfully sent message to ${response.successCount} devices.`);
        if (response.failureCount > 0) {
            console.error(`Failed to send to ${response.failureCount} devices.`);
            response.responses.forEach(resp => {
                if (!resp.success) {
                    console.error('Failure reason:', resp.error);
                }
            });
        }
        return { successCount: response.successCount, failureCount: response.failureCount };

    } catch (error: any) {
        console.error('Error sending notification:', error);
        if (error.code === 'messaging/invalid-argument') {
            throw new Error("Payload notifikasi tidak valid. Pastikan judul dan pesan terisi.");
        }
        throw new Error("Gagal mengirim notifikasi: " + error.message);
    }
}

    