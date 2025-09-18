

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { getWhatsappTemplate } from './whatsapp';
import { sendBulkWhatsAppMessage } from '@/services/whatsapp';
import type { Program, ProgramFormData, ProgramTag } from '@/lib/definitions';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { sendNotification } from './notifications';
import { getMembers } from './members';

const programsCollection = collection(db, 'programs');
const tagsCollection = collection(db, 'programTags');
const usersCollection = collection(db, 'users');

const toProgram = (doc: any): Program => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    } as Program;
}

// === Public Functions for AI Tool ===

export async function searchPrograms(searchQuery: string): Promise<Partial<Program>[]> {
  try {
    const q = query(
        programsCollection,
        orderBy('endDate', 'desc'),
        limit(10)
    );

    const snapshot = await getDocs(q);
    const allEntries: Program[] = snapshot.docs.map(toProgram);

    const searchTerms = searchQuery.toLowerCase().split(' ');
    const results = allEntries.filter(entry => {
        const searchableText = `${entry.title} ${entry.description} ${entry.tags.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
    }).slice(0, 5);

    return results.map(entry => ({
        id: entry.id,
        title: entry.title,
        endDate: entry.endDate,
        category: entry.category,
    }));
  } catch (error) {
    console.error("[searchPrograms Error]", error);
    throw new Error("Gagal mencari data program.");
  }
}


// Get all programs
export async function getPrograms(): Promise<Program[]> {
  try {
    const q = query(programsCollection, orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toProgram);
  } catch (error) {
    console.error("[getPrograms Error]", error);
    throw new Error("Gagal mengambil data program.");
  }
}

// Get a single program by ID
export async function getProgram(id: string): Promise<Program | null> {
    try {
        const programDocRef = doc(db, 'programs', id);
        const docSnap = await getDoc(programDocRef);
        if (docSnap.exists()) {
            return toProgram(docSnap);
        }
        return null;
    } catch (error) {
        console.error("[getProgram Error]", error);
        throw new Error("Gagal mengambil data program.");
    }
}

export async function createProgram(
    formData: FormData,
): Promise<string> {
    try {
        const programData = Object.fromEntries(formData.entries());
        const { 
            imageFile, attachment, dateRangeFrom, dateRangeTo, tags, isUnlimited,
            ...rest 
        } = programData;

        const dataToCreate: { [key: string]: any } = {
            ...rest,
            tags: Array.isArray(tags) ? tags : (tags as string).split(','),
            startDate: Timestamp.fromDate(new Date(dateRangeFrom as string)),
            createdAt: serverTimestamp(),
        };

        if (isUnlimited === 'true') {
            dataToCreate.endDate = null;
        } else if (dateRangeTo) {
            dataToCreate.endDate = Timestamp.fromDate(new Date(dateRangeTo as string));
        }

        if (programData.imageSource === 'upload' && imageFile instanceof File) {
            const imageRef = ref(storage, `program-images/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            dataToCreate.imageUrl = await getDownloadURL(imageRef);
        } else if (programData.imageSource === 'ai' && typeof programData.imageHint === 'string' && programData.imageHint) {
            const result = await generateImage({ prompt: programData.imageHint });
            if (!result.imageUrl) throw new Error("AI gagal membuat URL gambar.");
            dataToCreate.imageUrl = result.imageUrl;
        } else if (programData.imageSource === 'url' && typeof programData.imageUrl === 'string' && programData.imageUrl) {
             dataToCreate.imageUrl = programData.imageUrl;
        } else {
             dataToCreate.imageUrl = `https://picsum.photos/seed/${programData.title}/600/400`;
        }
        
        if (attachment instanceof File) {
          const attachmentRef = ref(storage, `program_attachments/${Date.now()}_${attachment.name}`);
          await uploadBytes(attachmentRef, attachment);
          dataToCreate.attachmentUrl = await getDownloadURL(attachmentRef);
          dataToCreate.attachmentName = attachment.name;
        }
        
        const docRef = await addDoc(programsCollection, dataToCreate);

        if (programData.programType === 'aktif') {
            try {
                await sendNotification(
                    {
                        title: `Program Baru: ${dataToCreate.title}`,
                        body: `Pendaftaran untuk program "${dataToCreate.title}" telah dibuka. Cek sekarang!`,
                        link: `/programs/${docRef.id}`
                    },
                    { type: 'all' }
                );
            } catch (e) { console.warn("[createProgram Warn] Gagal mengirim notifikasi push untuk program baru:", e); }

            try {
                const template = await getWhatsappTemplate('new_program_announcement');
                if (template.isActive && dateRangeTo) {
                    const members = await getMembers();
                    const phoneNumbers = members.map(doc => doc.waNumber).filter(Boolean) as string[];

                    if (phoneNumbers.length > 0) {
                        const message = template.message
                            .replace('{namaProgram}', dataToCreate.title)
                            .replace('{batasWaktu}', new Date(dateRangeTo as string).toLocaleDateString('id-ID'));
                        
                        await sendBulkWhatsAppMessage(phoneNumbers, message);
                    }
                }
            } catch (error) { console.warn(`[createProgram Warn] Gagal mengirim notifikasi WhatsApp massal:`, error); }
        }
        
        revalidatePath('/panel/programs');
        revalidatePath('/programs');
        revalidatePath(`/programs/${docRef.id}`);
        
        return docRef.id;

    } catch (error) {
        console.error('[createProgram Error] Server Action Error:', error);
        throw new Error(`Gagal total membuat program: ${(error as Error).message}`);
    }
}

// Update an existing program
export async function updateProgram(id: string, formData: FormData) {
    try {
        const programData = Object.fromEntries(formData.entries());
        const { 
            imageFile, attachment, dateRangeFrom, dateRangeTo, tags, isUnlimited,
            ...rest 
        } = programData;

        const dataToUpdate: { [key: string]: any } = {
            ...rest,
            tags: Array.isArray(tags) ? tags : (tags as string).split(','),
        };
        
        if (dateRangeFrom) dataToUpdate.startDate = Timestamp.fromDate(new Date(dateRangeFrom as string));
        
        if (isUnlimited === 'true') {
            dataToUpdate.endDate = null;
        } else if (dateRangeTo) {
            dataToUpdate.endDate = Timestamp.fromDate(new Date(dateRangeTo as string));
        }

        if (imageFile instanceof File) {
            const imageRef = ref(storage, `program-images/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            dataToUpdate.imageUrl = await getDownloadURL(imageRef);
        }

        if (attachment instanceof File) {
            const currentProgram = await getProgram(id);
            if (currentProgram?.attachmentUrl) {
                try {
                    const oldAttachmentRef = ref(storage, currentProgram.attachmentUrl);
                    await deleteObject(oldAttachmentRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.warn("[updateProgram Warn] Could not delete old attachment, it might not exist.", storageError);
                    }
                }
            }
            const attachmentRef = ref(storage, `program_attachments/${Date.now()}_${attachment.name}`);
            await uploadBytes(attachmentRef, attachment);
            dataToUpdate.attachmentUrl = await getDownloadURL(attachmentRef);
            dataToUpdate.attachmentName = attachment.name;
        }

        const programDoc = doc(db, 'programs', id);
        await updateDoc(programDoc, dataToUpdate);
        
        revalidatePath('/panel/programs');
        revalidatePath(`/panel/programs/edit/${id}`);
        revalidatePath('/programs');
        revalidatePath(`/programs/${id}`);
    } catch (error) {
        console.error("[updateProgram Error]", error);
        throw new Error("Gagal memperbarui program. " + (error as Error).message);
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
                console.error("[deleteProgram Error] Could not delete attachment:", storageError);
             }
        }
    }

    if (programToDelete?.imageUrl) {
        try {
            if (programToDelete.imageUrl.includes('firebasestorage.googleapis.com')) {
                const imageRef = ref(storage, programToDelete.imageUrl);
                await deleteObject(imageRef);
            }
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("[deleteProgram Error] Could not delete program image:", storageError);
             }
        }
    }

    revalidatePath('/panel/programs');
    revalidatePath('/programs');
  } catch (error) {
    console.error("[deleteProgram Error]", error);
    throw new Error("Gagal menghapus program.");
  }
}


// --- Tag Management ---

// Get all tags
export async function getProgramTags(): Promise<ProgramTag[]> {
  try {
    const snapshot = await getDocs(query(tagsCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgramTag));
  } catch (error) {
      console.error("[getProgramTags Error]", error);
      throw new Error("Gagal mengambil data tag.");
  }
}

// Add a new tag
export async function addProgramTag(name: string) {
    try {
        await addDoc(tagsCollection, { name });
        revalidatePath('/panel/programs/tags');
    } catch (error) {
        console.error("[addProgramTag Error]", error);
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
        console.error("[deleteProgramTag Error]", error);
        throw new Error("Gagal menghapus tag.");
    }
}
