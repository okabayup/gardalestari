

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData, limit, getDoc, doc, setDoc, Timestamp, updateDoc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { MemberWithStatus } from '@/lib/definitions';
import type { Position, PermissionId, PublicUser, PublicProfile, VerificationStatus, Mission } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
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
            skills: data.skills || [],
            interests: data.interests || [],
            referralCode: data.referralCode,
            referralCount: data.referralCount || 0,
            greenPoints: data.greenPoints || 0,
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
            skills: data.skills || [],
            interests: data.interests || [],
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

export async function updateUserProfile(userId: string, data: { username?: string, photoFile?: File, instagram?: string, linkedin?: string, skills?: string[], interests?: string[] }) {
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
    if (data.skills) {
      dataToUpdate.skills = data.skills;
    }
    if (data.interests) {
      dataToUpdate.interests = data.interests;
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

// Server action to handle file uploads and verification submission
export async function processVerificationSubmission(
  userId: string,
  data: { fullName: string; nik: string; ktpDataUrl: string; photoDataUrl?: string; waNumber: string; }
) {
  try {
    
    // Check for duplicate NIK against other users
    const nikQuery = query(collection(db, 'users'), where("nik", "==", data.nik));
    const nikSnapshot = await getDocs(nikQuery);
    if (!nikSnapshot.empty) {
        const isOwnNik = nikSnapshot.docs.some(doc => doc.id === userId);
        if (!isOwnNik) {
             throw new Error("NIK ini sudah terdaftar pada akun lain.");
        }
    }
    
    // Convert data URLs to buffers
    const ktpBuffer = Buffer.from(data.ktpDataUrl.split(',')[1], 'base64');
    
    // Upload KTP to storage
    const ktpRef = ref(storage, `kyc/${userId}/ktp.jpg`);
    await uploadBytes(ktpRef, ktpBuffer, { contentType: 'image/jpeg' });
    const ktpImageUrl = await getDownloadURL(ktpRef);
    
    let newPhotoURL = null;
    if (data.photoDataUrl) {
        const photoBuffer = Buffer.from(data.photoDataUrl.split(',')[1], 'base64');
        const profilePicRef = ref(storage, `profile-pictures/${userId}`);
        await uploadBytes(profilePicRef, photoBuffer, { contentType: 'image/jpeg' });
        newPhotoURL = await getDownloadURL(profilePicRef);
    }
    
    const username = await generateUniqueUsername(data.fullName);

    const verificationData: { [key: string]: any } = {
        fullName: data.fullName,
        displayName: data.fullName,
        username: username,
        nik: data.nik,
        waNumber: data.waNumber,
        waVerified: true,
        verificationStatus: 'temporary' as VerificationStatus,
        ktpImageUrl,
        submittedAt: serverTimestamp()
    };

    if (newPhotoURL) {
      verificationData.avatarUrl = newPhotoURL;
      verificationData.photoURL = newPhotoURL;
    }
    
    // Update user document in Firestore and Auth
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, verificationData, { merge: true });
    
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(userId, {
      displayName: data.fullName,
      ...(newPhotoURL && { photoURL: newPhotoURL }),
    });

    return { success: true };

  } catch (error) {
    console.error("[processVerificationSubmission Error]", error);
    throw new Error(`Gagal memproses pengajuan: ${(error as Error).message}`);
  }
}

export async function getUserUplineStructure(userId: string): Promise<Record<string, number>> {
    const structure: Record<string, number> = {};

    try {
        const q = query(collection(db, 'users'), where('upline', 'array-contains', userId));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const data = doc.data();
            const upline: string[] = data.upline || [];
            const index = upline.indexOf(userId);

            if (index !== -1) {
                const level = index + 1; // Level 1 is the direct referral
                const levelKey = `Level ${level}`;
                structure[levelKey] = (structure[levelKey] || 0) + 1;
            }
        });

        // Add Level 1 explicitly from referralCount for direct referrals
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
             structure['Level 1'] = userDoc.data().referralCount || 0;
        }

    } catch (error) {
        console.error('[getUserUplineStructure Error]', error);
    }

    return structure;
}
