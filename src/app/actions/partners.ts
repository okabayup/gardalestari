'use server';

import { revalidatePath } from 'next/cache';
import type { Partner } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile, deleteFile } from '@/lib/db';

const COL = 'partners';

export async function getPartners(): Promise<Partner[]> {
  try {
    const partners = await getAll<Partner>(COL);
    return partners.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[getPartners Error]', error);
    throw new Error('Gagal mengambil data mitra.');
  }
}

export async function getPartner(id: string): Promise<Partner | null> {
  try {
    return await getOne<Partner>(COL, id);
  } catch (error) {
    console.error('[getPartner Error]', error);
    throw new Error('Gagal mengambil detail mitra.');
  }
}

export async function createPartner(data: Omit<Partner, 'id' | 'logoUrl'>, logoFile: File) {
  try {
    const logoUrl = await uploadFile(
      logoFile,
      `partner-logos/${Date.now()}_${logoFile.name}`
    );
    await create(COL, { ...data, logoUrl } as Record<string, unknown>);
    revalidatePath('/panel/partners');
    revalidatePath('/');
  } catch (error) {
    console.error('[createPartner Error]', error);
    throw new Error(`Gagal membuat data mitra: ${(error as Error).message}`);
  }
}

export async function createPartnerWithUrl(data: Omit<Partner, 'id'>) {
  try {
    await create(COL, data as Record<string, unknown>);
    revalidatePath('/panel/partners');
    revalidatePath('/');
  } catch (error) {
    console.error('[createPartnerWithUrl Error]', error);
    throw new Error('Gagal membuat data mitra dengan URL.');
  }
}

export async function updatePartner(
  id: string,
  data: Partial<Omit<Partner, 'id' | 'logoUrl'>>,
  logoFile?: File
) {
  try {
    const dataToUpdate: Record<string, unknown> = { ...data };
    if (logoFile) {
      const current = await getOne<Partner>(COL, id);
      if (current?.logoUrl) await deleteFile(current.logoUrl);
      dataToUpdate.logoUrl = await uploadFile(
        logoFile,
        `partner-logos/${Date.now()}_${logoFile.name}`
      );
    }
    await update(COL, id, dataToUpdate);
    revalidatePath('/panel/partners');
    revalidatePath(`/panel/partners/edit/${id}`);
    revalidatePath('/');
  } catch (error) {
    console.error('[updatePartner Error]', error);
    throw new Error(`Gagal memperbarui data mitra: ${(error as Error).message}`);
  }
}

export async function updatePartnerWithUrl(id: string, data: Partial<Omit<Partner, 'id'>>) {
  try {
    await update(COL, id, data as Record<string, unknown>);
    revalidatePath('/panel/partners');
    revalidatePath(`/panel/partners/edit/${id}`);
    revalidatePath('/');
  } catch (error) {
    console.error('[updatePartnerWithUrl Error]', error);
    throw new Error('Gagal memperbarui data mitra dengan URL.');
  }
}

export async function deletePartner(id: string) {
  try {
    const partner = await getOne<Partner>(COL, id);
    if (partner?.logoUrl) await deleteFile(partner.logoUrl);
    await remove(COL, id);
    revalidatePath('/panel/partners');
    revalidatePath('/');
  } catch (error) {
    console.error('[deletePartner Error]', error);
    throw new Error('Gagal menghapus data mitra.');
  }
}
