
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteField, query, setDoc, Timestamp, getDoc, addDoc, where,getCountFromServer } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { PermissionId, Position, MemberWithStatus, MemberType, VerificationStatus } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from './whatsapp';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateUniqueUsername } from './user';
import { formatFullName } from '@/lib/utils';
import { sendNotification } from './notifications';

const usersCollection = collection(db, 'users');
const positionsCollection = collection(db, 'positions');

const OFFICIAL_ACCOUNT_PHONE = '+6285144904161';

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
    } catch {
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
        console.error("Error getting pending verification count:", error);
        return 0;
    }
}


// Get all members, sorted by creation time
export async function getMembers(): Promise<MemberWithStatus[]> {
  try {
    const q = query(usersCollection); 
    const snapshot = await getDocs(q);
    const members: MemberWithStatus[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Exclude the official account from the members list
      if (data.phoneNumber === OFFICIAL_ACCOUNT_PHONE) {
          continue;
      }
      
      // Denormalize position name and get permissions
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
        isSpecialMember: data.isSpecialMember || false,
        joinDate: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        ktpImageUrl: data.ktpImageUrl,
        selfieImageUrl: data.selfieImageUrl,
        nik: data.nik,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(), // Convert Timestamp to ISO String
        permissions: permissions,
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
    console.error("Error getting members:", error);
    throw new Error("Gagal mengambil data anggota.");
  }
}

// Update member details (position, type, region, verification status)
export async function updateMemberDetails(id: string, details: { positionId?: string, type?: MemberType | '', region?: string, verificationStatus?: VerificationStatus, isSpecialMember?: boolean, titlePrefix?: string, titlePostfix?: string }) {
    try {
        const memberDocRef = doc(db, 'users', id);
        const currentMemberDoc = await getDoc(memberDocRef);
        if (!currentMemberDoc.exists()) throw new Error("Anggota tidak ditemukan.");
        
        const currentMemberData = currentMemberDoc.data();
        const dataToUpdate: { [key: string]: any } = {};

        if (details.positionId) {
            dataToUpdate.positionId = details.positionId;
        } else if (details.positionId === '') { // Explicitly remove position
            dataToUpdate.positionId = deleteField();
        }

        if (details.type) {
            dataToUpdate.type = details.type;
        } else if (details.type === '') { // Explicitly remove type
            dataToUpdate.type = deleteField();
        }

        if (details.type === 'daerah' && details.region) {
            dataToUpdate.region = details.region;
        } else if (details.type !== 'daerah') {
            dataToUpdate.region = deleteField();
        }

        if (details.verificationStatus) {
            dataToUpdate.verificationStatus = details.verificationStatus;
        }

        if (details.isSpecialMember !== undefined) {
            dataToUpdate.isSpecialMember = details.isSpecialMember;
        }

        if (details.titlePrefix !== undefined) {
            dataToUpdate.titlePrefix = details.titlePrefix;
        }

        if (details.titlePostfix !== undefined) {
            dataToUpdate.titlePostfix = details.titlePostfix;
        }
        
        await setDoc(memberDocRef, dataToUpdate, { merge: true });

        // Send WhatsApp and Push notification if verification status changes
        if (details.verificationStatus && details.verificationStatus !== currentMemberData.verificationStatus) {
            const memberPhoneNumber = currentMemberData.waNumber;
            const memberName = currentMemberData.fullName;
            let templateId: 'member_verified_permanent' | 'member_verification_rejected' | null = null;
            let notificationPayload: { title: string, body: string } | null = null;
            
            if (details.verificationStatus === 'permanent') {
                templateId = 'member_verified_permanent';
                notificationPayload = { title: 'Verifikasi Berhasil!', body: 'Selamat! Akun Anda telah diverifikasi secara permanen.' };
            } else if (details.verificationStatus === 'rejected') {
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
                    { type: 'users', userIds: [id] }
                );
            }
        }
        
        revalidatePath('/panel/members');
        revalidatePath('/members');
    } catch (error) {
        console.error("Error updating member details:", error);
        throw new Error("Gagal memperbarui detail anggota.");
    }
}

// Manually create a member without an auth account
export async function createManualMember(
    data: {
        fullName: string,
        positionId: string,
        type: MemberType,
        isSpecialMember: boolean,
        titlePrefix?: string,
        titlePostfix?: string,
    },
    photoFile?: File
) {
    try {
        let avatarUrl = `https://picsum.photos/seed/${data.fullName.replace(/\s+/g, '-')}/200/200`;
        if (photoFile) {
            const storageRef = ref(storage, `profile-pictures/${Date.now()}-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            avatarUrl = await getDownloadURL(storageRef);
        }

        const username = await generateUniqueUsername(data.fullName);

        const newMemberData = {
            ...data,
            username,
            avatarUrl,
            phoneNumber: 'N/A',
            verificationStatus: 'manual' as VerificationStatus,
            createdAt: Timestamp.now(),
            level: 'Bronze',
            points: 0,
        };

        await addDoc(usersCollection, newMemberData);
        revalidatePath('/panel/members');
        revalidatePath('/members');

    } catch (error) {
        console.error("Error creating manual member:", error);
        throw new Error("Gagal membuat anggota manual.");
    }
}
