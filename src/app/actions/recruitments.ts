'use server';

import { revalidatePath } from 'next/cache';
import type { Recruitment } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, now } from '@/lib/db';

const COL = 'recruitments';

export async function getRecruitments(): Promise<Recruitment[]> {
  try {
    return await getAll<Recruitment>(COL, {
      orderBy: { field: 'deadline', direction: 'asc' },
    });
  } catch (error) {
    console.error('[getRecruitments Error]', error);
    throw new Error('Gagal memuat daftar rekrutmen.');
  }
}

export async function getRecruitment(id: string): Promise<Recruitment | null> {
  try {
    return await getOne<Recruitment>(COL, id);
  } catch (error) {
    console.error('[getRecruitment Error]', error);
    throw new Error('Gagal mengambil detail rekrutmen.');
  }
}

export async function createRecruitment(
  data: Omit<Recruitment, 'id' | 'createdAt' | 'partnerName' | 'partnerLogoUrl' | 'deadline' | 'description' | 'requirements'> & {
    deadline: Date | string;
    description: string;
    requirements: string;
  }
) {
  try {
    const dataToCreate: Record<string, unknown> = {
      ...data,
      deadline: data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline,
      createdAt: now(),
    };

    // Fetch partner info if external
    if (data.type === 'external' && data.partnerId) {
      const partner = await getOne<{ name: string; logoUrl: string }>('partners', data.partnerId);
      if (partner) {
        dataToCreate.partnerName = partner.name;
        dataToCreate.partnerLogoUrl = partner.logoUrl;
      }
    }

    await create(COL, dataToCreate);
    revalidatePath('/panel/recruitments');
    revalidatePath('/recruitments');
  } catch (error) {
    console.error('[createRecruitment Error]', error);
    throw new Error('Gagal membuat data rekrutmen.');
  }
}

export async function updateRecruitment(
  id: string,
  data: Partial<Omit<Recruitment, 'id' | 'createdAt' | 'deadline' | 'description' | 'requirements'>> & {
    deadline?: Date | string;
    description?: string;
    requirements?: string;
  }
) {
  try {
    const dataToUpdate: Record<string, unknown> = { ...data };
    if (data.deadline) {
      dataToUpdate.deadline =
        data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline;
    }

    if (data.type === 'external' && data.partnerId) {
      const partner = await getOne<{ name: string; logoUrl: string }>('partners', data.partnerId);
      if (partner) {
        dataToUpdate.partnerName = partner.name;
        dataToUpdate.partnerLogoUrl = partner.logoUrl;
      }
    } else if (data.type === 'internal') {
      dataToUpdate.partnerId = '';
      dataToUpdate.partnerName = '';
      dataToUpdate.partnerLogoUrl = '';
    }

    await update(COL, id, dataToUpdate);
    revalidatePath('/panel/recruitments');
    revalidatePath(`/panel/recruitments/edit/${id}`);
    revalidatePath('/recruitments');
  } catch (error) {
    console.error('[updateRecruitment Error]', error);
    throw new Error('Gagal memperbarui rekrutmen.');
  }
}

export async function deleteRecruitment(id: string) {
  try {
    await remove(COL, id);
    revalidatePath('/panel/recruitments');
    revalidatePath('/recruitments');
  } catch (error) {
    console.error('[deleteRecruitment Error]', error);
    throw new Error('Gagal menghapus rekrutmen.');
  }
}
