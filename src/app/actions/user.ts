
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

/**
 * Checks if a username already exists in the database.
 * @param username The username to check.
 * @returns {Promise<boolean>} True if the username exists, false otherwise.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!username) return false;

  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username existence:", error);
    // In case of error, assume it might exist to be safe, or handle as needed
    return true; 
  }
}

/**
 * Gets public user data by username.
 * @param username The username to fetch.
 * @returns {Promise<PublicUser | null>} The public user data or null if not found.
 */
export async function getUserByUsername(username: string): Promise<PublicUser | null> {
    if (!username) return null;
    try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();

        return {
            id: userDoc.id,
            username: data.username,
            fullName: data.fullName || data.displayName,
            avatarUrl: data.avatarUrl,
            level: data.level || 'Bronze',
        };

    } catch (error) {
        console.error("Error fetching user by username:", error);
        return null;
    }
}
