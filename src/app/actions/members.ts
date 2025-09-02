
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteField, query, setDoc, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected';
export type MemberType = 'pusat' | 'daerah' | 'cabang' | 'pembina';


export interface Member {
  id: string;
  name: string;
  username: string;
  position?: string;
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
}


const usersCollection = collection(db, 'users');

// Get all members, sorted by creation time
export async function getMembers(): Promise<MemberWithStatus[]> {
  // Removed orderBy from the query to avoid indexing issues.
  // Sorting will be done on the server after fetching.
  const q = query(usersCollection); 
  const snapshot = await getDocs(q);
  const members: MemberWithStatus[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    let joinDate: string | undefined;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        joinDate = data.createdAt.toDate().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    members.push({
      id: doc.id,
      name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
      username: data.username || `user_${doc.id.substring(0, 5)}`,
      phoneNumber: data.phoneNumber || 'N/A',
      verificationStatus: data.verificationStatus,
      avatarUrl: data.avatarUrl,
      position: data.position || 'Anggota',
      type: data.type || undefined,
      region: data.region || undefined,
      joinDate: joinDate,
      ktpImageUrl: data.ktpImageUrl,
      selfieImageUrl: data.selfieImageUrl,
      nik: data.nik,
      createdAt: data.createdAt, // Pass createdAt for sorting
    });
  });

  // Sort members by creation date in descending order (newest first)
  members.sort((a, b) => {
    const dateA = a.createdAt?.toDate() || new Date(0);
    const dateB = b.createdAt?.toDate() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return members;
}

// Update member details (position, type, region, verification status)
export async function updateMemberDetails(id: string, details: { position: string, type?: MemberType, region?: string, verificationStatus?: VerificationStatus }) {
    try {
        const memberDoc = doc(db, 'users', id);
        const dataToUpdate: { [key: string]: any } = {
            position: details.position
        };

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
