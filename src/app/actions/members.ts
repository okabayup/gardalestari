
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteField, query, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { PermissionId, Position } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';

export type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected';
export type MemberType = 'pusat' | 'daerah' | 'cabang' | 'pembina' | 'pengawas' | 'penasehat';


export interface Member {
  id: string;
  name: string;
  username: string;
  positionId?: string; 
  type?: MemberType;
  region?: string;
  avatarUrl?: string;
  isSpecialMember?: boolean;
}

export interface MemberWithStatus extends Member {
    phoneNumber: string;
    verificationStatus: VerificationStatus;
    joinDate?: string;
    ktpImageUrl?: string;
    selfieImageUrl?: string;
    nik?: string;
    createdAt?: string; // Changed to string to be serializable
    position?: string; 
    permissions: PermissionId[];
}


const usersCollection = collection(db, 'users');
const positionsCollection = collection(db, 'positions');

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


// Get all members, sorted by creation time
export async function getMembers(): Promise<MemberWithStatus[]> {
  const q = query(usersCollection); 
  const snapshot = await getDocs(q);
  const members: MemberWithStatus[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    let joinDate: string | undefined;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        joinDate = data.createdAt.toDate().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }
    
    // Denormalize position name and get permissions
    const { name: positionName, permissions } = await getPositionDetails(data.positionId);

    members.push({
      id: docSnap.id,
      name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
      username: data.username || `user_${docSnap.id.substring(0, 5)}`,
      phoneNumber: data.phoneNumber || 'N/A',
      verificationStatus: data.verificationStatus,
      avatarUrl: data.avatarUrl,
      position: positionName,
      positionId: data.positionId,
      type: data.type || undefined,
      region: data.region || undefined,
      isSpecialMember: data.isSpecialMember || false,
      joinDate: joinDate,
      ktpImageUrl: data.ktpImageUrl,
      selfieImageUrl: data.selfieImageUrl,
      nik: data.nik,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(), // Convert Timestamp to ISO String
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
}

// Update member details (position, type, region, verification status)
export async function updateMemberDetails(id: string, details: { positionId?: string, type?: MemberType, region?: string, verificationStatus?: VerificationStatus, isSpecialMember?: boolean }) {
    try {
        const memberDocRef = doc(db, 'users', id);
        const currentMemberDoc = await getDoc(memberDocRef);
        if (!currentMemberDoc.exists()) throw new Error("Anggota tidak ditemukan.");
        
        const currentMemberData = currentMemberDoc.data();
        const dataToUpdate: { [key: string]: any } = {};

        if (details.positionId) {
            dataToUpdate.positionId = details.positionId;
        } else if (details.positionId === undefined) {
             // No change
        } else {
            dataToUpdate.positionId = deleteField();
        }

        if (details.type) {
            dataToUpdate.type = details.type;
        } else if (details.type === undefined) {
            // No change
        } else {
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
        
        await setDoc(memberDocRef, dataToUpdate, { merge: true });

        // Send WhatsApp notification if verification status changes
        if (details.verificationStatus && details.verificationStatus !== currentMemberData.verificationStatus) {
            const memberPhoneNumber = currentMemberData.phoneNumber;
            if (memberPhoneNumber) {
                let message = '';
                if (details.verificationStatus === 'permanent') {
                    message = `Selamat ${currentMemberData.fullName}! Akun Garda Lestari Anda telah diverifikasi secara permanen. Anda sekarang dapat mengakses Kartu Tanda Anggota (KTA) digital Anda.`;
                } else if (details.verificationStatus === 'rejected') {
                    message = `Halo ${currentMemberData.fullName}. Mohon maaf, pengajuan verifikasi akun Garda Lestari Anda ditolak. Silakan periksa kembali data Anda dan coba lagi.`;
                }
                
                if (message) {
                    await sendWhatsAppMessage(memberPhoneNumber, message);
                }
            }
        }
        
        revalidatePath('/panel/members');
        revalidatePath('/members');
    } catch (error) {
        console.error("Error updating member details:", error);
        throw new Error("Gagal memperbarui detail anggota.");
    }
}
