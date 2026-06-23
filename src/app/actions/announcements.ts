'use server';

import { revalidatePath } from 'next/cache';
import type { Announcement } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile, deleteFile, now } from '@/lib/db';

const COL = 'announcements';

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    return await getAll<Announcement>(COL, {
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
  } catch (error) {
    console.error('Error getting announcements:', error);
    throw new Error('Gagal mengambil data pengumuman.');
  }
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    return await getOne<Announcement>(COL, id);
  } catch (error) {
    console.error('Error getting single announcement:', error);
    throw new Error('Gagal mengambil data pengumuman.');
  }
}

export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt'>,
  attachmentFile?: File
) {
  try {
    const announcementData: Record<string, unknown> = { ...data, createdAt: now() };
    if (attachmentFile) {
      announcementData.attachmentUrl = await uploadFile(
        attachmentFile,
        `announcements/${Date.now()}_${attachmentFile.name}`
      );
      announcementData.attachmentName = attachmentFile.name;
    }
    await create(COL, announcementData);
    revalidatePath('/panel/announcements');
    revalidatePath('/announcements');
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw new Error(`Gagal membuat pengumuman: ${(error as Error).message}`);
  }
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<Announcement, 'id' | 'createdAt'>>,
  attachmentFile?: File
) {
  try {
    const dataToUpdate: Record<string, unknown> = { ...data };
    if (attachmentFile) {
      const current = await getOne<Announcement>(COL, id);
      if (current?.attachmentUrl) await deleteFile(current.attachmentUrl);
      dataToUpdate.attachmentUrl = await uploadFile(
        attachmentFile,
        `announcements/${Date.now()}_${attachmentFile.name}`
      );
      dataToUpdate.attachmentName = attachmentFile.name;
    }
    await update(COL, id, dataToUpdate);
    revalidatePath('/panel/announcements');
    revalidatePath(`/panel/announcements/edit/${id}`);
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw new Error(`Gagal memperbarui pengumuman: ${(error as Error).message}`);
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const doc = await getOne<Announcement>(COL, id);
    if (doc?.attachmentUrl) await deleteFile(doc.attachmentUrl);
    await remove(COL, id);
    revalidatePath('/panel/announcements');
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw new Error('Gagal menghapus pengumuman.');
  }
}
