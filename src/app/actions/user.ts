
'use server';

import { collection, getDocs, doc, updateDoc, deleteField, query, setDoc, Timestamp, getDoc, addDoc, where,getCountFromServer, runTransaction, orderBy, limit, startAfter, endBefore, increment, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { PermissionId, Position, MemberWithStatus, MemberType, VerificationStatus, UserLevel, PublicUser, PublicProfile } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from '@/app/actions/settings';
import { sendNotification } from './notifications';
import { awardPointsForAction } from '@/app/actions/points';
import admin from 'firebase-admin';

if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}

const usersCollection = collection(db, 'users');
const positionsCollection = collection(db, 'positions');

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

export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!username) return false;

  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("[checkUsernameExists Error]", error);
    return true; 
  }
}

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
            username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
        }
    } catch (error) {
        console.error("[generateUniqueUsername Error]", error);
        throw new Error("Gagal membuat nama pengguna unik.");
    }
}

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

    const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
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

export async function processVerificationSubmission(
  userId: string,
  data: { fullName: string; nik: string; ktpDataUrl: string; photoDataUrl?: string; waNumber: string; }
) {
  try {
    
    const nikQuery = query(collection(db, 'users'), where("nik", "==", data.nik));
    const nikSnapshot = await getDocs(nikQuery);
    if (!nikSnapshot.empty) {
        const isOwnNik = nikSnapshot.docs.some(doc => doc.id === userId);
        if (!isOwnNik) {
             throw new Error("NIK ini sudah terdaftar pada akun lain.");
        }
    }
    
    const ktpBuffer = Buffer.from(data.ktpDataUrl.split(',')[1], 'base64');
    
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
    
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, verificationData, { merge: true });
    
    const auth = admin.auth();
    await auth.updateUser(userId, {
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

        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
             structure['Level 1'] = userDoc.data().referralCount || 0;
        }

    } catch (error) {
        console.error('[getUserUplineStructure Error]', error);
    }

    return structure;
}

export async function requestDataDeletion(userId: string) {
    if (!userId) throw new Error("ID pengguna dibutuhkan.");

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error("Pengguna tidak ditemukan.");

    const userData = userDoc.data();

    await updateDoc(userRef, {
        deletionRequestedAt: Timestamp.now(),
    });

    const adminPhoneNumber = '6285937010409';
    const message = `🚨 PERMINTAAN HAPUS DATA 🚨\n\nPengguna:\n- Nama: ${userData.fullName}\n- Username: ${userData.username}\n- UID: ${userId}\n\nTelah mengajukan permintaan penghapusan data. Mohon tinjau di panel admin.`;
    
    try {
        await sendWhatsAppMessage(adminPhoneNumber, message);
    } catch (e) {
        console.error("Failed to send WhatsApp alert for deletion request:", e);
    }

    revalidatePath('/panel/members');
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = admin.auth();
        const userRef = doc(db, 'users', userId);

        await auth.deleteUser(userId);

        await deleteDoc(userRef);
        
        revalidatePath('/panel/members');

        return { success: true };
    } catch (error) {
        console.error(`[deleteUserAccount Error] Failed to delete user ${userId}:`, error);
        return { success: false, error: (error as Error).message };
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

    
