
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
  try {
    const q = query(recruitmentsCollection, orderBy('deadline', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toRecruitment);
  } catch(error) {
    console.error("[getRecruitments Error]", error);
    throw new Error("Gagal memuat daftar rekrutmen.");
  }
}

// Get a single recruitment by ID
export async function getRecruitment(id: string): Promise<Recruitment | null> {
    try {
        const docRef = doc(db, 'recruitments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return toRecruitment(docSnap);
        }
        return null;
    } catch (error) {
        console.error("[getRecruitment Error]", error);
        throw new Error("Gagal mengambil detail rekrutmen.");
    }
}

// Create a new recruitment
export async function createRecruitment(data: Omit<Recruitment, 'id' | 'createdAt' | 'partnerName' | 'partnerLogoUrl' | 'deadline' | 'description' | 'requirements'> & { deadline: Date, description: string, requirements: string }) {
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
    console.error("[createRecruitment Error]", error);
    throw new Error("Gagal membuat data rekrutmen.");
  }
}

// Update an existing recruitment
export async function updateRecruitment(id: string, data: Partial<Omit<Recruitment, 'id' | 'createdAt' | 'deadline' | 'description' | 'requirements'>> & { deadline?: Date, description?: string, requirements?: string }) {
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
    console.error("[updateRecruitment Error]", error);
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
    console.error("[deleteRecruitment Error]", error);
    throw new Error("Gagal menghapus rekrutmen.");
  }
}
