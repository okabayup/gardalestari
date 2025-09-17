
'use server';

import { db } from '@/lib/firebase';
import { getMessaging } from 'firebase-admin/messaging';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, doc, FieldPath, orderBy, limit, writeBatch, getCountFromServer } from 'firebase/firestore';
import { initializeAdminApp } from '@/lib/firebase-admin';
import type { MemberType, Notification } from '@/lib/definitions';

const subscriptionsCollection = collection(db, 'pushSubscriptions');
const usersCollection = collection(db, 'users');
const notificationsCollection = collection(db, 'notifications');


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
    const q = query(subscriptionsCollection, where('token', '==', token));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(subscriptionsCollection, {
        userId,
        token,
        createdAt: serverTimestamp(),
      });
    } else {
      const docSnap = querySnapshot.docs[0];
      if (docSnap.data().userId !== userId) {
        await updateDoc(docSnap.ref, {
          userId,
          updatedAt: serverTimestamp(),
        });
      }
    }
    
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
        const batch = writeBatch(db);
        let targetUserIds: string[] = [];

        if (target.type === 'all') {
            const allUsersSnapshot = await getDocs(query(usersCollection));
            targetUserIds = allUsersSnapshot.docs.map(doc => doc.id);
        } else if (target.type === 'memberType' && target.memberType) {
            const usersQuery = query(usersCollection, where('type', '==', target.memberType));
            const usersSnapshot = await getDocs(usersQuery);
            targetUserIds = usersSnapshot.docs.map(doc => doc.id);
        } else if (target.type === 'users' && target.userIds && target.userIds.length > 0) {
            targetUserIds = target.userIds;
        }

        if (targetUserIds.length === 0) {
            return { successCount: 0, failureCount: 0, message: "Tidak ada pengguna target yang cocok dengan kriteria." };
        }

        // Save notification to Firestore for each user
        targetUserIds.forEach(userId => {
            const newNotifRef = doc(notificationsCollection);
            batch.set(newNotifRef, {
                userId,
                title: payload.title,
                body: payload.body,
                link: payload.link || '/',
                read: false,
                createdAt: serverTimestamp(),
            });
        });

        // Fetch tokens for push notification
        const tokens: string[] = [];
        if (targetUserIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < targetUserIds.length; i += 30) {
              chunks.push(targetUserIds.slice(i, i + 30));
          }
          for (const chunk of chunks) {
              const tokensQuery = query(subscriptionsCollection, where('userId', 'in', chunk));
              const subscriptionsSnapshot = await getDocs(tokensQuery);
              subscriptionsSnapshot.forEach(doc => tokens.push(doc.data().token));
          }
        }


        let pushSuccessCount = 0;
        let pushFailureCount = 0;

        if (tokens.length > 0) {
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
            pushSuccessCount = response.successCount;
            pushFailureCount = response.failureCount;
            console.log(`Successfully sent message to ${response.successCount} devices.`);
            if (response.failureCount > 0) {
                console.error(`Failed to send to ${response.failureCount} devices.`);
            }
        }
        
        // Commit Firestore writes
        await batch.commit();

        return { successCount: pushSuccessCount, failureCount: pushFailureCount, message: `Disimpan untuk ${targetUserIds.length} pengguna.` };

    } catch (error: any) {
        console.error('Error sending notification:', error);
        throw new Error("Gagal mengirim notifikasi: " + error.message);
    }
}

// Get notifications for a specific user
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    try {
        const q = query(
            notificationsCollection, 
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const snapshot = await getDocs(q);
        const notifications: Notification[] = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });
        return notifications;
    } catch (error) {
        console.error("Error getting notifications for user:", error);
        throw new Error("Gagal mengambil notifikasi.");
    }
}

// Mark notifications as read for a user
export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
    try {
        if (notificationIds.length === 0) return;
        const batch = writeBatch(db);
        notificationIds.forEach(id => {
            const notifRef = doc(db, 'notifications', id);
            batch.update(notifRef, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        throw new Error("Gagal menandai notifikasi sebagai telah dibaca.");
    }
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const q = query(
      notificationsCollection,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    return 0;
  }
}
