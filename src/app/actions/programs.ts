
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, getDocs as getFirestoreDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { getWhatsappTemplate } from './whatsapp';
import { sendBulkWhatsAppMessage } from '@/services/whatsapp';


export type ProgramSource = 'garda_lestari' | 'mitra';
export type SubmissionType = 'internal' | 'external';

export interface Program {
  id?: string;
  title: string;
  description: string;
  category: 'flagship' | 'ongoing';
  imageUrl: string;
  imageHint: string;
  tags: string[];
  startDate: Timestamp;
  endDate: Timestamp;
  source: ProgramSource;
  partnerId?: string; 
  benefits: string;
  requiredDocuments: string;
  submissionType: SubmissionType;
  applicationUrl?: string; 
  formId?: string;
  requiresRecommendation: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

// The data type received from the client-side form
export interface ProgramFormData extends Omit<Program, 'id' | 'startDate' | 'endDate' > {
    startDate: Date;
    endDate: Date;
}


const programsCollection = collection(db, 'programs');
const tagsCollection = collection(db, 'programTags');

// Get all programs
export async function getPrograms(): Promise<Program[]> {
  const snapshot = await getDocs(programsCollection);
  const programs: Program[] = [];
  snapshot.forEach(doc => {
    programs.push({ id: doc.id, ...doc.data() } as Program);
  });
  // Sort by end date, upcoming first
  return programs.sort((a, b) => a.endDate.toMillis() - b.endDate.toMillis());
}

// Get a single program by ID
export async function getProgram(id: string): Promise<Program | null> {
    const programDocRef = doc(db, 'programs', id);
    const docSnap = await getDoc(programDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Program;
    }
    return null;
}


// Create a new program
export async function createProgram(programData: ProgramFormData, attachmentFile?: File, imageFile?: File) {
  try {
    const dataToCreate: Omit<Program, 'id'> = {
        ...programData,
        startDate: Timestamp.fromDate(new Date(programData.startDate)),
        endDate: Timestamp.fromDate(new Date(programData.endDate)),
    };

    if (imageFile) {
        const imageRef = ref(storage, `program-images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        dataToCreate.imageUrl = await getDownloadURL(imageRef);
    }

    if (attachmentFile) {
        const attachmentRef = ref(storage, `program_attachments/${Date.now()}_${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        dataToCreate.attachmentUrl = await getDownloadURL(attachmentRef);
        dataToCreate.attachmentName = attachmentFile.name;
    }
    const docRef = await addDoc(programsCollection, dataToCreate);
    
    // --- WhatsApp Bulk Notification ---
    const template = await getWhatsappTemplate('new_program_announcement');
    if (template.isActive) {
        const usersSnapshot = await getFirestoreDocs(query(collection(db, 'users'), where('waVerified', '==', true)));
        const phoneNumbers = usersSnapshot.docs
            .map(doc => doc.data().waNumber)
            .filter(Boolean); // Filter out any undefined/null numbers

        if (phoneNumbers.length > 0) {
            const message = template.message
                .replace('{namaProgram}', dataToCreate.title)
                .replace('{batasWaktu}', new Date(programData.endDate).toLocaleDateString('id-ID'));
            
            try {
                // Send all at once
                await sendBulkWhatsAppMessage(phoneNumbers, message);
                console.log(`Bulk notification sent for program: ${dataToCreate.title}`);
            } catch (error) {
                console.warn(`Failed to send bulk 'new_program' notification:`, error);
            }
        }
    }
    // --- End WhatsApp Notification ---
    
    revalidatePath('/panel/programs');
    revalidatePath('/programs');
    return docRef.id;

  } catch (error) {
    console.error("Error creating program:", error);
    throw new Error("Gagal membuat program.");
  }
}

// Update an existing program
export async function updateProgram(id: string, program: Partial<ProgramFormData>, attachmentFile?: File, imageFile?: File) {
  try {
    const programDoc = doc(db, 'programs', id);
    
    // Convert dates to Timestamps before updating
    const dataToUpdate: { [key: string]: any } = { ...program };
    if (program.startDate) {
        dataToUpdate.startDate = Timestamp.fromDate(new Date(program.startDate));
    }
    if (program.endDate) {
        dataToUpdate.endDate = Timestamp.fromDate(new Date(program.endDate));
    }
    
    if (imageFile) {
        const imageRef = ref(storage, `program-images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        dataToUpdate.imageUrl = await getDownloadURL(imageRef);
    }

    if (attachmentFile) {
        const currentProgram = await getProgram(id);
        if (currentProgram?.attachmentUrl) {
            try {
                const oldAttachmentRef = ref(storage, currentProgram.attachmentUrl);
                await deleteObject(oldAttachmentRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old attachment, it might not exist.", storageError);
                }
            }
        }
        const attachmentRef = ref(storage, `program_attachments/${Date.now()}_${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        dataToUpdate.attachmentUrl = await getDownloadURL(attachmentRef);
        dataToUpdate.attachmentName = attachmentFile.name;
    }

    await updateDoc(programDoc, dataToUpdate);
    revalidatePath('/panel/programs');
    revalidatePath(`/panel/programs/edit/${id}`);
    revalidatePath('/programs');
    revalidatePath(`/programs/${id}`);
  } catch (error) {
    console.error("Error updating program:", error);
    throw new Error("Gagal memperbarui program.");
  }
}

// Delete a program
export async function deleteProgram(id: string) {
  try {
    const programToDelete = await getProgram(id);
    const programDoc = doc(db, 'programs', id);
    await deleteDoc(programDoc);

    if (programToDelete?.attachmentUrl) {
        try {
            const attachmentRef = ref(storage, programToDelete.attachmentUrl);
            await deleteObject(attachmentRef);
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("Could not delete attachment:", storageError);
             }
        }
    }

    if (programToDelete?.imageUrl) {
        try {
            // Only delete if it's a firebase storage URL
            if (programToDelete.imageUrl.includes('firebasestorage.googleapis.com')) {
                const imageRef = ref(storage, programToDelete.imageUrl);
                await deleteObject(imageRef);
            }
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("Could not delete program image:", storageError);
             }
        }
    }


    revalidatePath('/panel/programs');
    revalidatePath('/programs');
  } catch (error) {
    console.error("Error deleting program:", error);
    throw new Error("Gagal menghapus program.");
  }
}


// --- Tag Management ---

export interface ProgramTag {
    id?: string;
    name: string;
}

// Get all tags
export async function getProgramTags(): Promise<ProgramTag[]> {
    const snapshot = await getDocs(tagsCollection);
    const tags: ProgramTag[] = [];
    snapshot.forEach(doc => {
        tags.push({ id: doc.id, name: doc.data().name });
    });
    return tags.sort((a, b) => a.name.localeCompare(b.name));
}

// Add a new tag
export async function addProgramTag(name: string) {
    try {
        await addDoc(tagsCollection, { name });
        revalidatePath('/panel/programs/tags');
    } catch (error) {
        console.error("Error adding tag:", error);
        throw new Error("Gagal menambahkan tag baru.");
    }
}

// Delete a tag
export async function deleteProgramTag(id: string) {
    try {
        const tagDoc = doc(db, 'programTags', id);
        await deleteDoc(tagDoc);
        revalidatePath('/panel/programs/tags');
    } catch (error) {
        console.error("Error deleting tag:", error);
        throw new Error("Gagal menghapus tag.");
    }
}
