
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData, limit, getDoc, doc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { MemberWithStatus } from '@/lib/definitions';
import type { Position, PermissionId, PublicUser, PublicProfile } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';


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
    console.error("[checkUsernameExists Error]", error);
    // In case of error, assume it might exist to be safe, or handle as needed
    return true; 
  }
}

/**
 * Generates a unique username based on a full name.
 * @param fullName The full name to base the username on.
 * @returns {Promise<string>} A unique username.
 */
export async function generateUniqueUsername(fullName: string): Promise<string> {
    try {
        const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
        let username = baseUsername;
        
        while (true) {
            const q = query(collection(db, 'users'), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return username;
            }
            // If username exists, append a random number
            username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
        }
    } catch (error) {
        console.error("[generateUniqueUsername Error]", error);
        throw new Error("Gagal membuat nama pengguna unik.");
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
            joinDate: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            permissions: permissions,
            waNumber: data.waNumber,
            waVerified: data.waVerified || false,
            instagram: data.instagram,
            linkedin: data.linkedin,
        };

    } catch (error) {
        console.error("[getUserByUid Error]", error);
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
            joinDate: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            permissions: [], // Permissions are not needed for public profile
            instagram: data.instagram,
            linkedin: data.linkedin,
        };

    } catch (error) {
        console.error("[getUserByUsername Error]", error);
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
        console.error("[getUserByWaNumber Error]", error);
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
    console.error("[searchUsers Error]", error);
    return [];
  }
}


export async function saveWaNumber(userId: string, waNumber: string) {
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
            throw new Error(result.error || 'Gagal mengirim OTP dari layanan WhatsApp.');
        }
        return result;
    } catch (error) {
        console.error(`[saveWaNumber Error] for ${waNumber}:`, error);
        throw new Error((error as Error).message);
    }
}

export async function verifyWaNumber(userId: string, otp: string): Promise<boolean> {
    try {
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
    } catch (error) {
        console.error("[verifyWaNumber Error]", error);
        throw new Error("Gagal memverifikasi nomor WhatsApp.");
    }
}

export async function updateUserProfile(userId: string, data: { username?: string, photoFile?: File, instagram?: string, linkedin?: string }) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const dataToUpdate: { [key: string]: any } = {};

    if (data.photoFile) {
      console.log("[updateUserProfile] Uploading new profile picture...");
      const storageRef = ref(storage, `profile-pictures/${userId}`);
      await uploadBytes(storageRef, data.photoFile);
      dataToUpdate.avatarUrl = await getDownloadURL(storageRef);
      console.log("[updateUserProfile] Image uploaded successfully:", dataToUpdate.avatarUrl);
    }

    if (data.username) {
        const userDoc = await getDoc(userDocRef);
        const currentUsername = userDoc.data()?.username;
        if (data.username !== currentUsername) {
            const isAvailable = !(await checkUsernameExists(data.username));
            if (!isAvailable) {
                throw new Error('Nama pengguna tersebut sudah digunakan.');
            }
            dataToUpdate.username = data.username;
        }
    }

    if (data.instagram) {
      dataToUpdate.instagram = data.instagram;
    }
    if (data.linkedin) {
      dataToUpdate.linkedin = data.linkedin;
    }
    
    if (Object.keys(dataToUpdate).length > 0) {
      await updateDoc(userDocRef, dataToUpdate);
    }

    revalidatePath(`/profile/me`);
    revalidatePath(`/profile/${data.username}`);

  } catch (error) {
    console.error("[updateUserProfile Error]", error);
    throw new Error(`Gagal memperbarui profil: ${(error as Error).message}`);
  }
}
