'use server';

import { revalidatePath } from 'next/cache';
import type { ProgramForm } from '@/lib/definitions';
import { getAll, getOne, create, update, remove } from '@/lib/db';

const COL = 'programForms';

export async function getForms(): Promise<ProgramForm[]> {
  const forms = await getAll<ProgramForm>(COL);
  return forms.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getForm(id: string): Promise<ProgramForm | null> {
  return await getOne<ProgramForm>(COL, id);
}

export async function createForm(form: Omit<ProgramForm, 'id'>): Promise<string> {
  try {
    const id = await create(COL, form as Record<string, unknown>);
    revalidatePath('/panel/forms');
    return id;
  } catch (error) {
    console.error('Error creating form:', error);
    throw new Error('Gagal membuat formulir.');
  }
}

export async function updateForm(id: string, form: Partial<ProgramForm>) {
  try {
    await update(COL, id, form as Record<string, unknown>);
    revalidatePath('/panel/forms');
    revalidatePath(`/panel/forms/edit/${id}`);
  } catch (error) {
    console.error('Error updating form:', error);
    throw new Error('Gagal memperbarui formulir.');
  }
}

export async function deleteForm(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/forms');
  } catch (error) {
    console.error('Error deleting form:', error);
    throw new Error('Gagal menghapus formulir.');
  }
}
