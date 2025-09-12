
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData, limit, getDoc, doc, setDoc } from 'firebase/firestore';
import type { MemberWithStatus, MemberType } from './members';
import type { Position, PermissionId } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';


export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface PublicProfile extends MemberWithStatus {
    // This interface just combines the existing types for clarity.
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

export async function getUserByUid(uid: string): Promise<(MemberWithStatus & { waNumber?: string }) | null> {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return null;
        }

        const data = userDoc.data();

         let positionName = 'Anggota';
         let permissions: PermissionId[] = [];
         if (data.positionId) {
            const positionDoc = await getDoc(doc(db, 'positions', data.positionId));
            if (positionDoc.exists()) {
                const posData = positionDoc.data() as Position
                positionName = posData.name;
                permissions = posData.permissions || [];
            }
         }

        let joinDate: string | undefined;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            joinDate = data.createdAt.toDate().toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }

        return {
            id: userDoc.id,
            name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
            username: data.username,
            avatarUrl: data.avatarUrl,
            phoneNumber: data.phoneNumber || 'N/A',
            verificationStatus: data.verificationStatus || 'unverified',
            position: positionName,
            positionId: data.positionId,
            type: data.type,
            region: data.region,
            isSpecialMember: data.isSpecialMember,
            joinDate: joinDate,
            permissions: permissions,
            waNumber: data.waNumber,
            waVerified: data.waVerified || false,
        };

    } catch (error) {
        console.error("Error fetching user by UID:", error);
        return null;
    }
}


/**
 * Gets public user data by username for KTA verification.
 * @param username The username to fetch.
 * @returns {Promise<PublicProfile | null>} The public user data or null if not found.
 */
export async function getUserByUsername(username: string): Promise<PublicProfile | null> {
    if (!username) return null;
    try {
        const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();

         let positionName = 'Anggota';
         if (data.positionId) {
            const positionDoc = await getDoc(doc(db, 'positions', data.positionId));
            if (positionDoc.exists()) {
                positionName = (positionDoc.data() as Position).name;
            }
         }

        let joinDate: string | undefined;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            joinDate = data.createdAt.toDate().toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }

        return {
            id: userDoc.id,
            name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
            username: data.username,
            avatarUrl: data.avatarUrl,
            level: data.level || 'Bronze',
            phoneNumber: data.phoneNumber || 'N/A',
            verificationStatus: data.verificationStatus || 'unverified',
            position: positionName,
            positionId: data.positionId,
            type: data.type,
            region: data.region,
            joinDate: joinDate,
            permissions: [], // Permissions are not needed for public profile
        };

    } catch (error) {
        console.error("Error fetching user by username:", error);
        return null;
    }
}


export async function getUserByWaNumber(waNumber: string): Promise<PublicUser | null> {
    if (!waNumber) return null;
    try {
        const q = query(collection(db, 'users'), where('waNumber', '==', waNumber), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        
        return {
            id: userDoc.id,
            username: data.username,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            level: data.level,
        };

    } catch (error) {
        console.error("Error fetching user by WhatsApp number:", error);
        return null;
    }
}


/**
 * Searches for users by username or full name.
 * @param searchQuery The search term.
 * @param limitCount The maximum number of users to return.
 * @returns {Promise<PublicUser[]>} A list of public user data.
 */
export async function searchUsers(searchQuery: string, limitCount: number = 5): Promise<PublicUser[]> {
  if (!searchQuery) return [];

  const searchTerm = searchQuery.toLowerCase();
  
  try {
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      limit(limitCount)
    );

    const fullNameQuery = query(
      collection(db, 'users'),
      where('fullName', '>=', searchTerm),
      where('fullName', '<=', searchTerm + '\uf8ff'),
      limit(limitCount)
    );

    const [usernameSnapshot, fullNameSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(fullNameQuery)
    ]);
    
    const usersMap = new Map<string, PublicUser>();

    const processSnapshot = (snapshot: DocumentData) => {
        snapshot.forEach((doc: DocumentData) => {
            if (!usersMap.has(doc.id)) {
                const data = doc.data();
                 usersMap.set(doc.id, {
                    id: doc.id,
                    username: data.username,
                    fullName: data.fullName || data.displayName,
                    avatarUrl: data.avatarUrl,
                    level: data.level || 'Bronze',
                });
            }
        });
    }

    processSnapshot(usernameSnapshot);
    processSnapshot(fullNameSnapshot);
    
    return Array.from(usersMap.values()).slice(0, limitCount);

  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}


export async function saveWaNumber(userId: string, waNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
        const userDocRef = doc(db, 'users', userId);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await setDoc(userDocRef, {
            waNumber: waNumber,
            waOtp: otp,
            waVerified: false,
        }, { merge: true });

        const result = await sendWhatsAppMessage(waNumber, `Kode verifikasi Garda Lestari Anda adalah: ${otp}`);
        if (!result.success) {
            throw new Error(result.error || 'Gagal mengirimkan kode OTP dari server.');
        }

        return { success: true };
    } catch (error) {
        const errorMessage = (error as Error).message || 'Gagal mengirimkan kode OTP.';
        console.error(`Failed to send OTP to ${waNumber}:`, errorMessage);
        return { success: false, error: errorMessage };
    }
}

export async function verifyWaNumber(userId: string, otp: string): Promise<boolean> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().waOtp === otp) {
        await setDoc(userDocRef, {
            waVerified: true,
            waOtp: null, // Clear OTP after verification
        }, { merge: true });
        return true;
    }
    return false;
}
