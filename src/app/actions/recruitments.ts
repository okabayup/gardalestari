
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Recruitment } from '@/lib/definitions';

const recruitmentsCollection = collection(db, 'recruitments');
const partnersCollection = collection(db, 'partners');

const toRecruitment = (doc: any): Recruitment => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        deadline: (data.deadline as Timestamp).toDate().toISOString(),
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as Recruitment;
}

// Get all recruitments
export async function getRecruitments(): Promise<Recruitment[]> {
  const q = query(recruitmentsCollection, orderBy('deadline', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toRecruitment);
}

// Get a single recruitment by ID
export async function getRecruitment(id: string): Promise<Recruitment | null> {
    const docRef = doc(db, 'recruitments', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return toRecruitment(docSnap);
    }
    return null;
}

// Create a new recruitment
export async function createRecruitment(data: Omit<Recruitment, 'id' | 'createdAt' | 'partnerName' | 'partnerLogoUrl' | 'deadline'> & { deadline: Date }) {
  try {
    const dataToCreate: { [key: string]: any } = {
        ...data,
        deadline: Timestamp.fromDate(data.deadline),
        createdAt: Timestamp.now(),
    };
    
    if (data.type === 'external' && data.partnerId) {
        const partnerDoc = await getDoc(doc(partnersCollection, data.partnerId));
        if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            dataToCreate.partnerName = partnerData.name;
            dataToCreate.partnerLogoUrl = partnerData.logoUrl;
        }
    }

    await addDoc(recruitmentsCollection, dataToCreate);
    revalidatePath('/panel/recruitments');
    revalidatePath('/recruitments');
  } catch (error) {
    console.error("Error creating recruitment:", error);
    throw new Error("Gagal membuat data rekrutmen.");
  }
}

// Update an existing recruitment
export async function updateRecruitment(id: string, data: Partial<Omit<Recruitment, 'id' | 'createdAt' | 'deadline'>> & { deadline?: Date }) {
  try {
    const docRef = doc(db, 'recruitments', id);
    const dataToUpdate: { [key: string]: any } = { ...data };
    
    if (data.deadline) {
        dataToUpdate.deadline = Timestamp.fromDate(data.deadline);
    }

    if (data.type === 'external' && data.partnerId) {
        const partnerDoc = await getDoc(doc(partnersCollection, data.partnerId));
        if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            dataToUpdate.partnerName = partnerData.name;
            dataToUpdate.partnerLogoUrl = partnerData.logoUrl;
        }
    } else if (data.type === 'internal') {
        dataToUpdate.partnerId = '';
        dataToUpdate.partnerName = '';
        dataToUpdate.partnerLogoUrl = '';
    }

    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/recruitments');
    revalidatePath(`/panel/recruitments/edit/${id}`);
    revalidatePath('/recruitments');
  } catch (error) {
    console.error("Error updating recruitment:", error);
    throw new Error("Gagal memperbarui rekrutmen.");
  }
}

// Delete a recruitment
export async function deleteRecruitment(id: string) {
  try {
    await deleteDoc(doc(db, 'recruitments', id));
    revalidatePath('/panel/recruitments');
    revalidatePath('/recruitments');
  } catch (error) {
    console.error("Error deleting recruitment:", error);
    throw new Error("Gagal menghapus rekrutmen.");
  }
}
