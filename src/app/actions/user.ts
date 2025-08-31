
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
