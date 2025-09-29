

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteField, query, setDoc, Timestamp, getDoc, addDoc, where,getCountFromServer, runTransaction, orderBy, limit, startAfter, endBefore, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { PermissionId, Position, MemberWithStatus, MemberType, VerificationStatus } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from './whatsapp';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { generateUniqueUsername, getUserByUid } from './user';
import { formatFullName } from '@/lib/utils';
import { sendNotification } from './notifications';
import { format } from 'date-fns';

const usersCollection = collection(db, 'users');
const positionsCollection = collection(db, 'positions');

const OFFICIAL_ACCOUNT_PHONE = process.env.SATUCONNECT_DEVICE_ID;
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;

// Helper to get position details from ID
async function getPositionDetails(positionId?: string): Promise<{ name: string, permissions: PermissionId[] }> {
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

      // Exclude the official account from the members list
      if (data.phoneNumber === `+${OFFICIAL_ACCOUNT_PHONE}`) {
          continue;
      }
      
      // For public view, also exclude hidden members and unverified
      if (forPublic && (data.isHidden === true || (data.verificationStatus !== 'permanent' && data.verificationStatus !== 'manual'))) {
          continue;
      }
      
      const { name: positionName, permissions } = await getPositionDetails(data.positionId);

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
        joinDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        ktpImageUrl: data.ktpImageUrl,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        permissions: permissions,
        referralCode: data.referralCode,
        referralCount: data.referralCount,
      });
    }
    
    // Sort members by creation date in descending order (newest first)
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

export async function resetVerificationData(userId: string) {
    if (!userId) throw new Error("ID Pengguna dibutuhkan.");

    const userRef = doc(db, 'users', userId);

    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) throw new Error("Pengguna tidak ditemukan.");

        const userData = userDoc.data();

        // Delete KTP image from storage if it exists
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

        // Extract data from FormData
        const positionId = formData.get('positionId') as string;
        const type = formData.get('type') as string;
        const region = formData.get('region') as string;
        const verificationStatus = formData.get('verificationStatus') as VerificationStatus;
        const isSpecialMember = formData.get('isSpecialMember') === 'true';
        const isHidden = formData.get('isHidden') === 'true';
        const titlePrefix = formData.get('titlePrefix') as string;
        const titlePostfix = formData.get('titlePostfix') as string;
        const photoFile = formData.get('photoFile') as File | null;
        
        // Handle file upload first
        if (photoFile && photoFile.size > 0) {
            console.log("[updateMemberDetails] Uploading new profile picture...");
            // Optionally delete the old photo
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

        // Handle text fields
        dataToUpdate.titlePrefix = titlePrefix;
        dataToUpdate.titlePostfix = titlePostfix;
        dataToUpdate.isSpecialMember = isSpecialMember;
        dataToUpdate.isHidden = isHidden;
        dataToUpdate.verificationStatus = verificationStatus;

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

        // Send WhatsApp and Push notification if verification status changes
        if (verificationStatus && verificationStatus !== currentMemberData.verificationStatus) {
            let templateId: 'kta_activated' | 'member_verification_rejected' | null = null;
            let notificationPayload: { title: string, body: string } | null = null;
            
            if (verificationStatus === 'permanent') {
                templateId = 'kta_activated';
                notificationPayload = { title: 'Verifikasi Berhasil!', body: 'Selamat! Akun Anda telah diverifikasi secara permanen.' };

                // Increment referrer's count if this user was referred
                if (currentMemberData.referredBy) {
                    const referrerRef = doc(db, 'users', currentMemberData.referredBy);
                    await runTransaction(db, async (transaction) => {
                        transaction.update(referrerRef, { referralCount: increment(1) });
                    });
                }

            } else if (verificationStatus === 'rejected') {
                templateId = 'member_verification_rejected';
                 notificationPayload = { title: 'Verifikasi Ditolak', body: 'Pengajuan verifikasi Anda ditolak. Silakan periksa kembali data Anda.' };
            }
            
            if (templateId) {
                const template = await getWhatsappTemplate(templateId);
                if (template.isActive && memberPhoneNumber) {
                     const message = template.message.replace('{namaPengguna}', memberName);
                     await sendWhatsAppMessage(memberPhoneNumber, message);
                }
            }

            if (notificationPayload) {
                await sendNotification(
                    { ...notificationPayload, link: '/profile/me' },
                    { type: 'users', userIds: [userId] }
                );
            }
        }
        
        // Send WhatsApp and Push notification if position changes
        const newPositionId = dataToUpdate.positionId || "no-position";
        const oldPositionId = currentMemberData.positionId || "no-position";
        
        if (newPositionId !== oldPositionId) {
            const { name: newPositionName } = await getPositionDetails(newPositionId === "no-position" ? undefined : newPositionId);

            await sendNotification(
                { 
                    title: 'Jabatan Diperbarui', 
                    body: `Selamat! Jabatan Anda telah diperbarui menjadi ${newPositionName}.`,
                    link: '/profile/me'
                },
                { type: 'users', userIds: [userId] }
            );

            const template = await getWhatsappTemplate('member_position_updated');
            if (template.isActive && memberPhoneNumber) {
                const message = template.message
                    .replace('{namaPengguna}', memberName)
                    .replace('{namaJabatan}', newPositionName);
                await sendWhatsAppMessage(memberPhoneNumber, message);
            }
        }
        
        revalidatePath('/panel/members');
        revalidatePath('/members');
    } catch (error) {
        console.error("[updateMemberDetails Error]", error);
        throw new Error(`Gagal memperbarui detail anggota: ${(error as Error).message}`);
    }
}


// Manually create a member without an auth account
export async function createManualMember(formData: FormData) {
    try {
        const fullName = formData.get('fullName') as string;
        const photoFile = formData.get('photoFile') as File | null;
        
        let avatarUrl = `https://picsum.photos/seed/${fullName.replace(/\s+/g, '-')}/200/200`;

        if (photoFile && photoFile.size > 0) {
            console.log("[createManualMember] Uploading profile picture...");
            const storageRef = ref(storage, `profile-pictures/${Date.now()}-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            avatarUrl = await getDownloadURL(storageRef);
            console.log("[createManualMember] Image uploaded successfully:", avatarUrl);
        }
        
        console.log("[createManualMember] Generating username...");
        const username = await generateUniqueUsername(fullName);

        const newMemberData = {
            fullName: fullName,
            positionId: formData.get('positionId') as string,
            type: formData.get('type') as MemberType,
            isSpecialMember: formData.get('isSpecialMember') === 'true',
            isHidden: formData.get('isHidden') === 'true',
            region: formData.get('region') as string | undefined,
            titlePrefix: formData.get('titlePrefix') as string | undefined,
            titlePostfix: formData.get('titlePostfix') as string | undefined,
            username,
            avatarUrl,
            phoneNumber: 'N/A',
            verificationStatus: 'manual' as VerificationStatus,
            createdAt: Timestamp.now(),
            referralCount: 0,
        };
        
        console.log("[createManualMember] Creating document in Firestore...");
        await addDoc(usersCollection, newMemberData);
        
        revalidatePath('/panel/members');
        revalidatePath('/members');
        revalidatePath('/tentang');

    } catch (error) {
        console.error("[createManualMember Error]", error);
        throw new Error(`Gagal membuat anggota manual: ${(error as Error).message}`);
    }
}
