
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

export interface Partner {
  id?: string;
  name: string;
  websiteUrl: string;
  logoUrl: string;
  isFeatured: boolean;
}

const partnersCollection = collection(db, 'partners');

// Get all partners
export async function getPartners(): Promise<Partner[]> {
  const snapshot = await getDocs(partnersCollection);
  const partners: Partner[] = [];
  snapshot.forEach(doc => {
    partners.push({ id: doc.id, ...doc.data() } as Partner);
  });
  return partners.sort((a, b) => a.name.localeCompare(b.name));
}

// Get a single partner by ID
export async function getPartner(id: string): Promise<Partner | null> {
    const partnerDocRef = doc(db, 'partners', id);
    const docSnap = await getDoc(partnerDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Partner;
    }
    return null;
}

// Create a new partner
export async function createPartner(data: Omit<Partner, 'id' | 'logoUrl'>, logoFile: File) {
  try {
    const logoRef = ref(storage, `partners/${Date.now()}_${logoFile.name}`);
    await uploadBytes(logoRef, logoFile);
    const logoUrl = await getDownloadURL(logoRef);

    const newPartner = {
      ...data,
      logoUrl,
    };
    await addDoc(partnersCollection, newPartner);

    revalidatePath('/admin/partners');
    revalidatePath('/');
  } catch (error) {
    console.error("Error creating partner:", error);
    throw new Error("Gagal membuat data mitra.");
  }
}

// Update an existing partner
export async function updatePartner(id: string, data: Partial<Omit<Partner, 'logoUrl'>>, newLogoFile?: File) {
  try {
    const partnerDoc = doc(db, 'partners', id);
    const updateData: Partial<Partner> = { ...data };

    if (newLogoFile) {
        // Optional: Delete old logo if you want to save space
        const currentPartner = await getPartner(id);
        if (currentPartner?.logoUrl) {
            try {
                const oldLogoRef = ref(storage, currentPartner.logoUrl);
                await deleteObject(oldLogoRef);
            } catch (storageError) {
                console.warn("Could not delete old logo, it might not exist.", storageError);
            }
        }

        const logoRef = ref(storage, `partners/${Date.now()}_${newLogoFile.name}`);
        await uploadBytes(logoRef, newLogoFile);
        updateData.logoUrl = await getDownloadURL(logoRef);
    }
    
    await updateDoc(partnerDoc, updateData);

    revalidatePath('/admin/partners');
    revalidatePath(`/admin/partners/edit/${id}`);
    revalidatePath('/');
  } catch (error) {
    console.error("Error updating partner:", error);
    throw new Error("Gagal memperbarui data mitra.");
  }
}

// Delete a partner
export async function deletePartner(id: string) {
  try {
    const partnerDocRef = doc(db, 'partners', id);
    const partner = await getPartner(id);
    
    // Delete from Firestore
    await deleteDoc(partnerDocRef);
    
    // Delete logo from Storage
    if (partner?.logoUrl) {
        const logoRef = ref(storage, partner.logoUrl);
        await deleteObject(logoRef);
    }

    revalidatePath('/admin/partners');
    revalidatePath('/');
  } catch (error) {
    console.error("Error deleting partner:", error);
    throw new Error("Gagal menghapus data mitra.");
  }
}
