
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface PushSubscription {
  userId: string;
  token: string;
  createdAt: any;
}

const subscriptionsCollection = collection(db, 'pushSubscriptions');

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
