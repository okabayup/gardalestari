'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';
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
    const q = query(programsCollection, orderBy('endDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
        } as Program;
    });
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
    programData: ProgramFormData,
    imageFile?: File,
    attachmentFile?: File
): Promise<string> {
    try {
        const dataToCreate: { [key: string]: any } = {
            ...programData,
            startDate: Timestamp.fromDate(new Date(programData.dateRange.from)),
            endDate: Timestamp.fromDate(new Date(programData.dateRange.to)),
        };
        delete dataToCreate.dateRange;
        delete dataToCreate.imageFile;
        delete dataToCreate.attachment;

        try {
            if (programData.imageSource === 'ai' && programData.imageHint) {
                const result = await generateImage({ prompt: programData.imageHint });
                if (!result.imageUrl) throw new Error("AI gagal membuat URL gambar.");
                dataToCreate.imageUrl = result.imageUrl;
            } else if (programData.imageSource === 'upload' && imageFile) {
                const imageRef = ref(storage, `program-images/${Date.now()}_${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                dataToCreate.imageUrl = await getDownloadURL(imageRef);
            } else if (programData.imageSource === 'url' && programData.imageUrl) {
                 dataToCreate.imageUrl = programData.imageUrl;
            } else {
                 dataToCreate.imageUrl = `https://picsum.photos/seed/${programData.title.replace(/\s+/g, '-')}/600/400`;
            }
        } catch (error) {
            console.error("[createProgram Error] Image handling failed:", error);
            throw new Error(`Gagal memproses gambar program: ${(error as Error).message}`);
        }

        if (attachmentFile) {
          try {
            const attachmentRef = ref(storage, `program_attachments/${Date.now()}_${attachmentFile.name}`);
            await uploadBytes(attachmentRef, attachmentFile);
            dataToCreate.attachmentUrl = await getDownloadURL(attachmentRef);
            dataToCreate.attachmentName = attachmentFile.name;
          } catch (uploadError) {
            console.error("[createProgram Error] Attachment upload failed:", uploadError);
            throw new Error("Gagal mengunggah lampiran.");
          }
        }
        
        let docRef;
        try {
            docRef = await addDoc(programsCollection, dataToCreate);
        } catch(error) {
            console.error("[createProgram Error] Firestore save failed:", error);
            throw new Error(`Gagal menyimpan program ke database: ${(error as Error).message}`);
        }

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
                if (template.isActive) {
                    const members = await getMembers();
                    const phoneNumbers = members.map(doc => doc.waNumber).filter(Boolean) as string[];

                    if (phoneNumbers.length > 0) {
                        const message = template.message
                            .replace('{namaProgram}', dataToCreate.title)
                            .replace('{batasWaktu}', new Date(programData.dateRange.to).toLocaleDateString('id-ID'));
                        
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
export async function updateProgram(id: string, program: Partial<ProgramFormData>, imageFile?: File, attachmentFile?: File) {
    try {
        const dataToUpdate: { [key: string]: any } = { ...program };

        const programDoc = doc(db, 'programs', id);
        
        if (program.dateRange?.from) {
            dataToUpdate.startDate = Timestamp.fromDate(new Date(program.dateRange.from));
        }
        if (program.dateRange?.to) {
            dataToUpdate.endDate = Timestamp.fromDate(new Date(program.dateRange.to));
        }
        delete dataToUpdate.dateRange;
        
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
                        console.warn("[updateProgram Warn] Could not delete old attachment, it might not exist.", storageError);
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
