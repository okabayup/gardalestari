
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';

export interface FormFieldOption {
  id: string;
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
}

export interface ProgramForm {
  id?: string;
  title: string;
  description: string;
  fields: FormField[];
}

const formsCollection = collection(db, 'programForms');

// Get all forms
export async function getForms(): Promise<ProgramForm[]> {
  const snapshot = await getDocs(formsCollection);
  const forms: ProgramForm[] = [];
  snapshot.forEach(doc => {
    forms.push({ id: doc.id, ...doc.data() } as ProgramForm);
  });
  return forms.sort((a, b) => a.title.localeCompare(b.title));
}

// Get a single form by ID
export async function getForm(id: string): Promise<ProgramForm | null> {
    const formDocRef = doc(db, 'programForms', id);
    const docSnap = await getDoc(formDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ProgramForm;
    }
    return null;
}

// Create a new form
export async function createForm(form: Omit<ProgramForm, 'id'>) {
  try {
    const docRef = await addDoc(formsCollection, form);
    revalidatePath('/admin/forms');
    return docRef.id;
  } catch (error) {
    console.error("Error creating form:", error);
    throw new Error("Gagal membuat formulir.");
  }
}

// Update an existing form
export async function updateForm(id: string, form: Partial<ProgramForm>) {
  try {
    const formDoc = doc(db, 'programForms', id);
    await updateDoc(formDoc, form);
    revalidatePath('/admin/forms');
    revalidatePath(`/admin/forms/edit/${id}`);
  } catch (error) {
    console.error("Error updating form:", error);
    throw new Error("Gagal memperbarui formulir.");
  }
}

// Delete a form
export async function deleteForm(id: string) {
  try {
    const formDoc = doc(db, 'programForms', id);
    await deleteDoc(formDoc);
    revalidatePath('/admin/forms');
  } catch (error) {
    console.error("Error deleting form:", error);
    throw new Error("Gagal menghapus formulir.");
  }
}
