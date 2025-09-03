
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteField, query, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { PermissionId, Position } from '@/lib/definitions';

export type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected';
export type MemberType = 'pusat' | 'daerah' | 'cabang' | 'pembina';


export interface Member {
  id: string;
  name: string;
  username: string;
  positionId?: string; 
  type?: MemberType;
  region?: string;
  avatarUrl?: string;
}

export interface MemberWithStatus extends Member {
    phoneNumber: string;
    verificationStatus: VerificationStatus;
    joinDate?: string;
    ktpImageUrl?: string;
    selfieImageUrl?: string;
    nik?: string;
    createdAt?: Timestamp;
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
      joinDate: joinDate,
      ktpImageUrl: data.ktpImageUrl,
      selfieImageUrl: data.selfieImageUrl,
      nik: data.nik,
      createdAt: data.createdAt, 
      permissions: permissions,
    });
  }

  // Sort members by creation date in descending order (newest first)
  members.sort((a, b) => {
    const dateA = a.createdAt?.toDate() || new Date(0);
    const dateB = b.createdAt?.toDate() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return members;
}

// Update member details (position, type, region, verification status)
export async function updateMemberDetails(id: string, details: { positionId?: string, type?: MemberType, region?: string, verificationStatus?: VerificationStatus }) {
    try {
        const memberDoc = doc(db, 'users', id);
        const dataToUpdate: { [key: string]: any } = {};

        if (details.positionId) {
            dataToUpdate.positionId = details.positionId;
        } else {
            dataToUpdate.positionId = deleteField();
        }

        if (details.type) {
            dataToUpdate.type = details.type;
        } else {
            dataToUpdate.type = deleteField();
        }

        if (details.type === 'daerah' && details.region) {
            dataToUpdate.region = details.region;
        } else {
            dataToUpdate.region = deleteField();
        }

        if (details.verificationStatus) {
            dataToUpdate.verificationStatus = details.verificationStatus;
        }
        
        await setDoc(memberDoc, dataToUpdate, { merge: true });
        
        revalidatePath('/panel/members');
        revalidatePath('/members');
    } catch (error) {
        console.error("Error updating member details:", error);
        throw new Error("Gagal memperbarui detail anggota.");
    }
}
