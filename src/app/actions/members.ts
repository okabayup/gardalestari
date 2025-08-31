
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected';
export type MemberType = 'pusat' | 'daerah' | 'pembina';


export interface Member {
  id: string;
  name: string;
  position?: string;
  type?: MemberType;
  region?: string;
  avatarUrl?: string;
}

export interface MemberWithStatus extends Member {
    phoneNumber: string;
    verificationStatus: VerificationStatus;
}


const usersCollection = collection(db, 'users');

// Get all members
export async function getMembers(): Promise<MemberWithStatus[]> {
  const snapshot = await getDocs(usersCollection);
  const members: MemberWithStatus[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    members.push({
      id: doc.id,
      name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
      phoneNumber: data.phoneNumber || 'N/A',
      verificationStatus: data.verificationStatus || 'unverified',
      avatarUrl: data.avatarUrl,
      position: data.position || 'Anggota',
      type: data.type || undefined,
      region: data.region || undefined,
    } as MemberWithStatus);
  });
  return members;
}

// Update member status
export async function updateMemberStatus(id: string, status: 'permanent' | 'rejected') {
    try {
        const memberDoc = doc(db, 'users', id);
        await updateDoc(memberDoc, {
            verificationStatus: status
        });
        revalidatePath('/admin/members');
    } catch (error) {
        console.error("Error updating member status:", error);
        throw new Error("Gagal memperbarui status anggota.");
    }
}
