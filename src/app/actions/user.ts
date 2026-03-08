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
import { sendEmail } from '@/services/email';

if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}

const usersCollection = collection(db, 'users');
const positionsCollection = collection(db, 'positions');
const OFFICIAL_ACCOUNT_PHONE = process.env.SATUCONNECT_DEVICE_ID;
const ADMIN_NOTIFICATION_PHONE = '6285144904161';
const ADMIN_NOTIFICATION_EMAIL = 'halo@gardalestari.org';


// === FROM members.ts (MERGED) ===

// Helper to get position details from ID
async function getPositionDetails(positionId?: string, userName?: string): Promise<{ name: string, permissions: PermissionId[] }> {
    // Override position for Oka Bayu Pratama as requested
    if (userName === 'Oka Bayu Pratama') {
        return { name: 'Sekretaris', permissions: [] };
    }

    if (!positionId) return { name: 'Anggota', permissions: [] };
    try {
        const positionDoc = await getDoc(doc(positionsCollection, positionId));
        if (positionDoc.exists()) {
            const positionData = positionDoc.data() as Position;
            return {
                name: positionData.name,
                permissions: positionData.permissions || []
            };
        }
        return { name: 'Anggota', permissions: [] };
    } catch (error) {
        console.error("[getPositionDetails Error]", error);
        return { name: 'Anggota', permissions: [] };
    }
}

// Get the count of members waiting for verification
export async function getPendingVerificationCount(): Promise<number> {
  try {
    const q = query(usersCollection, where('verificationStatus', '==', 'temporary'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("[getPendingVerificationCount Error]", error);
    throw new Error("Gagal mengambil jumlah verifikasi tertunda.");
  }
}

// Get all members, sorted by creation time
export async function getMembers(forPublic: boolean = false): Promise<MemberWithStatus[]> {
  try {
    const snapshot = await getDocs(usersCollection); 
    
    let members: MemberWithStatus[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      if (data.phoneNumber === `+${OFFICIAL_ACCOUNT_PHONE}`) {
          continue;
      }
      
      if (forPublic && (data.isHidden === true || (data.verificationStatus !== 'permanent' && data.verificationStatus !== 'manual') || data.isSuspended)) {
          continue;
      }
      
      const { name: positionName, permissions } = await getPositionDetails(data.positionId, data.fullName || data.displayName);

      members.push({
        id: docSnap.id,
        name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
        username: data.username || `user_${docSnap.id.substring(0, 5)}`,
        titlePrefix: data.titlePrefix || '',
        titlePostfix: data.titlePostfix || '',
        phoneNumber: data.phoneNumber || 'N/A',
        waNumber: data.waNumber,
        waVerified: data.waVerified || false,
        verificationStatus: data.verificationStatus,
        avatarUrl: data.avatarUrl,
        position: positionName,
        positionId: data.positionId,
        type: data.type || undefined,
        region: data.region,
        isSpecialMember: data.isSpecialMember || false,
        isHidden: data.isHidden || false,
        isSuspended: data.isSuspended || false,
        joinDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        ktpImageUrl: data.ktpImageUrl,
        email: data.email,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        permissions: permissions,
        referralCode: data.referralCode,
        referralCount: data.referralCount || 0,
        referredBy: data.referredBy,
        upline: data.upline || [],
        level: data.level || 'bronze',
        deletionRequestedAt: data.deletionRequestedAt,
      });
    }
    
    members.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return members;
  } catch (error) {
    console.error("[getMembers Error]", error);
    throw new Error("Gagal mengambil data anggota.");
  }
}

export async function createManualMember(formData: FormData) {
    const data: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
        if (key === 'photoFile' && value instanceof File) {
            const photoFile = value;
            const storageRef = ref(storage, `profile-pictures/${Date.now()}-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            data.avatarUrl = await getDownloadURL(storageRef);
            data.photoURL = data.avatarUrl;
        } else if (key === 'isSpecialMember' || key === 'isHidden') {
            data[key] = value === 'true';
        } else {
            data[key] = value;
        }
    }

    const username = await generateUniqueUsername(data.fullName);

    await addDoc(usersCollection, {
        ...data,
        username,
        verificationStatus: 'manual' as VerificationStatus,
        createdAt: Timestamp.now(),
        phoneNumber: `MANUAL-${Date.now()}`,
    });
    revalidatePath('/panel/members');
}


export async function resetVerificationData(userId: string) {
    if (!userId) throw new Error("ID Pengguna dibutuhkan.");

    const userRef = doc(db, 'users', userId);

    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) throw new Error("Pengguna tidak ditemukan.");

        const userData = userDoc.data();

        if (userData.ktpImageUrl && userData.ktpImageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const ktpRef = ref(storage, userData.ktpImageUrl);
                await deleteObject(ktpRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    console.warn(`[resetVerificationData] Gagal menghapus file KTP lama untuk pengguna ${userId}:`, storageError);
                }
            }
        }
        
        await updateDoc(userRef, {
            verificationStatus: 'unverified',
            nik: deleteField(),
            ktpImageUrl: deleteField(),
            submittedAt: deleteField(),
        });
        
        revalidatePath('/panel/members');
    } catch (error) {
        console.error(`[resetVerificationData] Gagal mereset verifikasi untuk pengguna ${userId}:`, error);
        throw new Error(`Gagal mereset data verifikasi: ${(error as Error).message}`);
    }
}


// Update member details
export async function updateMemberDetails(userId: string, formData: FormData) {
    try {
        const memberDocRef = doc(db, 'users', userId);
        const currentMemberDoc = await getDoc(memberDocRef);
        if (!currentMemberDoc.exists()) throw new Error("Anggota tidak ditemukan.");
        
        const currentMemberData = currentMemberDoc.data();
        const dataToUpdate: { [key: string]: any } = {};

        const positionId = formData.get('positionId') as string;
        const type = formData.get('type') as string;
        const region = formData.get('region') as string;
        const verificationStatus = formData.get('verificationStatus') as VerificationStatus;
        const isSpecialMember = formData.get('isSpecialMember') === 'true';
        const isHidden = formData.get('isHidden') === 'true';
        const isSuspended = formData.get('isSuspended') === 'true';
        const titlePrefix = formData.get('titlePrefix') as string;
        const titlePostfix = formData.get('titlePostfix') as string;
        const level = formData.get('level') as UserLevel;
        const photoFile = formData.get('photoFile') as File | null;
        
        if (photoFile && photoFile.size > 0) {
            console.log("[updateMemberDetails] Uploading new profile picture...");
            if (currentMemberData.avatarUrl && currentMemberData.avatarUrl.includes('firebasestorage.googleapis.com')) {
                 try {
                    const oldPhotoRef = ref(storage, currentMemberData.avatarUrl);
                    await deleteObject(oldPhotoRef);
                     console.log("[updateMemberDetails] Deleted old profile picture.");
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.warn("[updateMemberDetails Warn] Old photo not found, skipping deletion.", storageError);
                    }
                }
            }
            const storageRef = ref(storage, `profile-pictures/${userId}-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            dataToUpdate.avatarUrl = await getDownloadURL(storageRef);
        }

        dataToUpdate.titlePrefix = titlePrefix;
        dataToUpdate.titlePostfix = titlePostfix;
        dataToUpdate.isSpecialMember = isSpecialMember;
        dataToUpdate.isHidden = isHidden;
        dataToUpdate.isSuspended = isSuspended;
        dataToUpdate.verificationStatus = verificationStatus;
        dataToUpdate.level = level;

        if (positionId === 'no-position') {
            dataToUpdate.positionId = deleteField();
        } else {
            dataToUpdate.positionId = positionId;
        }

        if (type === 'no-type') {
            dataToUpdate.type = deleteField();
        } else {
            dataToUpdate.type = type;
        }

        if (type === 'daerah' && region) {
            dataToUpdate.region = region;
        } else {
            dataToUpdate.region = deleteField();
        }
        
        await updateDoc(memberDocRef, dataToUpdate);

        const memberPhoneNumber = currentMemberData.waNumber;
        const memberName = currentMemberData.fullName;
        const memberEmail = currentMemberData.email;

        if (verificationStatus && verificationStatus !== currentMemberData.verificationStatus) {
            let templateId: 'kta_activated' | 'member_verification_rejected' | null = null;
            let emailSubject = '';
            let notificationPayload: { title: string, body: string } | null = null;
            
            if (verificationStatus === 'permanent' && !currentMemberData.referralPointsAwarded) {
                templateId = 'kta_activated';
                emailSubject = 'Selamat! KTA Garda Lestari Anda Telah Aktif';
                notificationPayload = { title: 'Verifikasi Berhasil!', body: 'Selamat! Akun Anda telah diverifikasi secara permanen.' };

                if (currentMemberData.upline && currentMemberData.upline.length > 0) {
                    for (let i = 0; i < currentMemberData.upline.length; i++) {
                        const referrerId = currentMemberData.upline[i];
                        const referralLevel = i + 1; 
                        try {
                            await awardPointsForAction('referral', referrerId, `Bonus rujukan Lvl. ${referralLevel} dari ${memberName}`, referralLevel);
                        } catch (e) {
                             console.error(`[Referral Points Error] Gagal memberikan poin Level ${referralLevel} ke ${referrerId}`, e);
                        }
                    }
                    await updateDoc(memberDocRef, { referralPointsAwarded: true });
                }

            } else if (verificationStatus === 'rejected') {
                templateId = 'member_verification_rejected';
                emailSubject = 'Pembaruan Status Verifikasi Garda Lestari Anda';
                 notificationPayload = { title: 'Verifikasi Ditolak', body: 'Pengajuan verifikasi Anda ditolak. Silakan periksa kembali data Anda.' };
            }
            
            if (templateId) {
                const template = await getWhatsappTemplate(templateId);
                const message = template.message.replace('{namaPengguna}', memberName);
                if (template.isActive) {
                    if (memberPhoneNumber) {
                         await sendWhatsAppMessage(memberPhoneNumber, message);
                    }
                    if (memberEmail) {
                        await sendEmail({ to: memberEmail, subject: emailSubject, text: message });
                    }
                }
            }

            if (notificationPayload) {
                await sendNotification(
                    { ...notificationPayload, link: '/profile/me' },
                    { type: 'users', userIds: [userId] }
                );
            }
        }
        
        const newPositionId = dataToUpdate.positionId || "no-position";
        const oldPositionId = currentMemberData.positionId || "no-position";
        
        if (newPositionId !== oldPositionId) {
            const { name: newPositionName } = await getPositionDetails(newPositionId === "no-position" ? undefined : newPositionId, memberName);

            await sendNotification(
                { 
                    title: 'Jabatan Diperbarui', 
                    body: `Selamat! Jabatan Anda telah diperbarui menjadi ${newPositionName}.`,
                    link: '/profile/me'
                },
                { type: 'users', userIds: [userId] }
            );

            const template = await getWhatsappTemplate('member_position_updated');
            const message = template.message
                .replace('{namaPengguna}', memberName)
                .replace('{namaJabatan}', newPositionName);

            if (template.isActive && memberPhoneNumber) {
                await sendWhatsAppMessage(memberPhoneNumber, message);
            }
            if(memberEmail) {
                await sendEmail({
                    to: memberEmail,
                    subject: 'Pembaruan Jabatan di Garda Lestari',
                    text: message,
                });
            }
        }
        
        revalidatePath('/panel/members');
        revalidatePath('/members');
    } catch (error) {
        console.error("[updateMemberDetails Error]", error);
        throw new Error(`Gagal memperbarui detail anggota: ${(error as Error).message}`);
    }
}


// === END OF MERGED FROM members.ts ===


export async function getUserByUid(uid: string): Promise<(MemberWithStatus & { email?:string, waNumber?: string }) | null> {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return null;
        }

        const data = userDoc.data();

         const { name: positionName, permissions } = await getPositionDetails(data.positionId, data.fullName || data.displayName);

        return {
            id: userDoc.id,
            name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
            username: data.username,
            email: data.email,
            avatarUrl: data.avatarUrl,
            phoneNumber: data.phoneNumber || 'N/A',
            verificationStatus: data.verificationStatus || 'unverified',
            position: positionName,
            positionId: data.positionId,
            type: data.type,
            region: data.region,
            isSpecialMember: data.isSpecialMember,
            isSuspended: data.isSuspended || false,
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

         const { name: positionName } = await getPositionDetails(data.positionId, data.fullName || data.displayName);

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
            permissions: [], 
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
        getDocs(fullNameSnapshot)
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

const normalizePhoneNumber = (phone: string): string => {
    let normalized = phone.replace(/\D/g, ''); 
    if (normalized.startsWith('0')) {
        normalized = '62' + normalized.substring(1);
    } else if (!normalized.startsWith('62')) {
        normalized = '62' + normalized;
    }
    return normalized;
};


export async function saveWaNumber(userId: string, waNumber: string) {
    try {
        const userDocRef = doc(db, 'users', userId);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const formattedNumber = normalizePhoneNumber(waNumber);
        
        await setDoc(userDocRef, {
            waNumber: formattedNumber,
            waOtp: otp,
            waVerified: false,
        }, { merge: true });

        const result = await sendWhatsAppMessage(formattedNumber, `Kode verifikasi Garda Lestari Anda adalah: ${otp}`);
        
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
                waOtp: deleteField(), 
            }, { merge: true });
            return true;
        }
        return false;
    } catch (error) {
        console.error("[verifyWaNumber Error]", error);
        throw new Error("Gagal memverify nomor WhatsApp.");
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
    const formattedWaNumber = normalizePhoneNumber(data.waNumber);

    const verificationData: { [key: string]: any } = {
        fullName: data.fullName,
        displayName: data.fullName,
        username: username,
        nik: data.nik,
        waNumber: formattedWaNumber,
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
                const level = index + 1; 
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

    const message = `🚨 PERMINTAAN HAPUS DATA 🚨\n\nPengguna:\n- Nama: ${userData.fullName}\n- Username: ${userData.username}\n- UID: ${userId}\n\nTelah mengajukan permintaan penghapusan data. Mohon tinjau di panel admin.`;
    
    try {
        await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, message);
    } catch (e) {
        console.error("Failed to send WhatsApp alert for deletion request:", e);
    }
     try {
        await sendEmail({
            to: ADMIN_NOTIFICATION_EMAIL,
            subject: `Permintaan Hapus Data: ${userData.fullName}`,
            text: message,
        });
    } catch(e) {
        console.error("Failed to send email alert for deletion request:", e);
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

export async function suspendUser(userId: string, reason: string): Promise<void> {
  if (!userId) {
    throw new Error('ID Pengguna dibutuhkan.');
  }

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  await updateDoc(userRef, {
    isSuspended: true,
    suspensionReason: reason,
  });
  
  revalidatePath('/panel/members');
  revalidatePath(`/profile/${userDoc.data().username}`);
}