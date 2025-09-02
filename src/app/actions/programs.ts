
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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
  // New fields
  source: ProgramSource;
  partnerId?: string; // Optional, only if source is 'mitra'
  benefits: string;
  requiredDocuments: string;
  submissionType: SubmissionType;
  applicationUrl?: string; // Optional, only if submissionType is 'external'
  requiresRecommendation: boolean;
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
export async function createProgram(program: Omit<Program, 'id'>) {
  try {
    await addDoc(programsCollection, program);
    revalidatePath('/admin/programs');
    revalidatePath('/programs');
  } catch (error) {
    console.error("Error creating program:", error);
    throw new Error("Gagal membuat program.");
  }
}

// Update an existing program
export async function updateProgram(id: string, program: Partial<Program>) {
  try {
    const programDoc = doc(db, 'programs', id);
    await updateDoc(programDoc, program);
    revalidatePath('/admin/programs');
    revalidatePath(`/admin/programs/edit/${id}`);
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
    const programDoc = doc(db, 'programs', id);
    await deleteDoc(programDoc);
    revalidatePath('/admin/programs');
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
        revalidatePath('/admin/programs/tags');
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
        revalidatePath('/admin/programs/tags');
    } catch (error) {
        console.error("Error deleting tag:", error);
        throw new Error("Gagal menghapus tag.");
    }
}
