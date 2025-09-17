
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { Partner } from '@/lib/definitions';

const partnersCollection = collection(db, 'partners');

// Get all partners
export async function getPartners(): Promise<Partner[]> {
  try {
    const snapshot = await getDocs(partnersCollection);
    const partners: Partner[] = [];
    snapshot.forEach(doc => {
      partners.push({ id: doc.id, ...doc.data() } as Partner);
    });
    return partners.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("[getPartners Error]", error);
    throw new Error("Gagal mengambil data mitra.");
  }
}

// Get a single partner by ID
export async function getPartner(id: string): Promise<Partner | null> {
    try {
        const partnerDocRef = doc(db, 'partners', id);
        const docSnap = await getDoc(partnerDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Partner;
        }
        return null;
    } catch (error) {
        console.error("[getPartner Error]", error);
        throw new Error("Gagal mengambil detail mitra.");
    }
}

// Create a new partner
export async function createPartner(data: Omit<Partner, 'id' | 'logoUrl'>, logoFile: File) {
  try {
    const logoRef = ref(storage, `partner-logos/${Date.now()}_${logoFile.name}`);
    await uploadBytes(logoRef, logoFile);
    const logoUrl = await getDownloadURL(logoRef);
    
    const partnerData = { ...data, logoUrl };
    await addDoc(partnersCollection, partnerData);
    
    revalidatePath('/panel/partners');
    revalidatePath('/');
  } catch (error) {
    console.error("[createPartner Error]", error);
    throw new Error(`Gagal membuat data mitra: ${(error as Error).message}`);
  }
}

// Create a new partner using a URL for the logo
export async function createPartnerWithUrl(data: Omit<Partner, 'id'>) {
    try {
        await addDoc(partnersCollection, data);
        revalidatePath('/panel/partners');
        revalidatePath('/');
    } catch (error) {
        console.error("[createPartnerWithUrl Error]", error);
        throw new Error("Gagal membuat data mitra dengan URL.");
    }
}


// Update an existing partner
export async function updatePartner(id: string, data: Partial<Omit<Partner, 'id' | 'logoUrl'>>, logoFile?: File) {
  try {
    const partnerDoc = doc(db, 'partners', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    if (logoFile) {
        const currentPartner = await getPartner(id);
        if (currentPartner?.logoUrl && currentPartner.logoUrl.includes('firebasestorage.googleapis.com')) {
             try {
                const oldLogoRef = ref(storage, currentPartner.logoUrl);
                await deleteObject(oldLogoRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    console.warn("[updatePartner Warn] Could not delete old logo, it might not exist.", storageError);
                }
            }
        }
        const newLogoRef = ref(storage, `partner-logos/${Date.now()}_${logoFile.name}`);
        await uploadBytes(newLogoRef, newLogoRef);
        dataToUpdate.logoUrl = await getDownloadURL(newLogoRef);
    }
    
    await updateDoc(partnerDoc, dataToUpdate);

    revalidatePath('/panel/partners');
    revalidatePath(`/panel/partners/edit/${id}`);
    revalidatePath('/');
  } catch (error) {
    console.error("[updatePartner Error]", error);
    throw new Error(`Gagal memperbarui data mitra: ${(error as Error).message}`);
  }
}

// Update partner that uses a URL for logo
export async function updatePartnerWithUrl(id: string, data: Partial<Omit<Partner, 'id'>>) {
    try {
        const partnerDoc = doc(db, 'partners', id);
        await updateDoc(partnerDoc, data);
        revalidatePath('/panel/partners');
        revalidatePath(`/panel/partners/edit/${id}`);
        revalidatePath('/');
    } catch (error) {
        console.error("[updatePartnerWithUrl Error]", error);
        throw new Error("Gagal memperbarui data mitra dengan URL.");
    }
}


// Delete a partner
export async function deletePartner(id: string) {
  try {
    const partnerDocRef = doc(db, 'partners', id);
    const partner = await getPartner(id);
    
    if (partner?.logoUrl && partner.logoUrl.includes('firebasestorage.googleapis.com')) {
        try {
            const logoRef = ref(storage, partner.logoUrl);
            await deleteObject(logoRef);
        } catch (storageError) {
            if ((storageError as any).code !== 'storage/object-not-found') {
                 console.error("[deletePartner Error] Deleting logo failed:", storageError);
            }
        }
    }

    await deleteDoc(partnerDocRef);

    revalidatePath('/panel/partners');
    revalidatePath('/');
  } catch (error) {
    console.error("[deletePartner Error]", error);
    throw new Error("Gagal menghapus data mitra.");
  }
}
