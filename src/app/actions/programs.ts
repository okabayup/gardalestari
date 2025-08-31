
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface Program {
  id?: string;
  title: string;
  description: string;
  category: 'flagship' | 'ongoing';
  imageUrl: string;
  imageHint: string;
}

const programsCollection = collection(db, 'programs');

// Get all programs
export async function getPrograms(): Promise<Program[]> {
  const snapshot = await getDocs(programsCollection);
  const programs: Program[] = [];
  snapshot.forEach(doc => {
    programs.push({ id: doc.id, ...doc.data() } as Program);
  });
  return programs;
}

// Get a single program by ID
export async function getProgram(id: string): Promise<Program | null> {
    const programDoc = doc(db, 'programs', id);
    const docSnap = await getDoc(programDoc);
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
