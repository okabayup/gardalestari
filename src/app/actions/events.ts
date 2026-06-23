'use server';

import { revalidatePath } from 'next/cache';
export type { Event } from '@/lib/definitions';
import type { Event } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile, deleteFile, now } from '@/lib/db';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { getWhatsappTemplate } from './settings';
import { sendBulkWhatsAppMessage } from '@/services/whatsapp';
import { getMembers } from './user';

const COL = 'events';

// ─── AI Tool ─────────────────────────────────────────────────────────────────

export async function searchEvents(searchQuery: string): Promise<Partial<Event>[]> {
  try {
    const allEntries = await getAll<Event>(COL, {
      orderBy: { field: 'startDate', direction: 'desc' },
      limit: 10,
    });
    const terms = searchQuery.toLowerCase().split(' ');
    return allEntries
      .filter(e => {
        const text = `${e.title} ${(e as any).description} ${(e as any).location}`.toLowerCase();
        return terms.some(t => text.includes(t));
      })
      .slice(0, 5)
      .map(({ id, title, startDate, endDate, location }: any) => ({ id, title, startDate, endDate, location }));
  } catch (error) {
    console.error('[searchEvents Error]', error);
    throw new Error('Gagal mencari acara.');
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  try {
    return await getAll<Event>(COL, {
      orderBy: { field: 'startDate', direction: 'asc' },
    });
  } catch (error) {
    console.error('[getEvents Error]', error);
    throw new Error('Gagal mengambil data acara.');
  }
}

export async function getEvent(id: string): Promise<Event | null> {
  try {
    return await getOne<Event>(COL, id);
  } catch (error) {
    console.error('[getEvent Error]', error);
    throw new Error('Gagal mengambil data acara.');
  }
}

async function resolveImage(
  imageSource: string,
  imageFile: File | null,
  imageHint: string,
  imageUrl: string,
  fallbackTitle: string
): Promise<string> {
  if (imageSource === 'upload' && imageFile && imageFile.size > 0) {
    return await uploadFile(imageFile, `event-images/${Date.now()}_${imageFile.name}`);
  }
  if (imageSource === 'ai' && imageHint) {
    const result = await generateImage({ prompt: imageHint });
    if (result.imageUrl) {
      if (result.imageUrl.startsWith('data:')) {
        const buf = Buffer.from(result.imageUrl.split(',')[1], 'base64');
        return await uploadFile(buf, `event-images/${Date.now()}_ai_generated.png`);
      }
      return result.imageUrl;
    }
  }
  if (imageSource === 'url' && imageUrl) return imageUrl;
  return `https://picsum.photos/seed/${fallbackTitle}/600/400`;
}

export async function createEvent(formData: FormData) {
  try {
    const d = Object.fromEntries(formData.entries());
    const dataToCreate: Record<string, unknown> = {
      title: d.title,
      slug: d.slug,
      description: d.description,
      location: d.location,
      visibility: d.visibility,
      submissionType: d.submissionType,
      applicationUrl: d.applicationUrl,
      formId: d.formId,
      startDate: new Date(d.dateRangeFrom as string).toISOString(),
      endDate: d.dateRangeTo ? new Date(d.dateRangeTo as string).toISOString() : null,
      attendeeIds: [],
      guestAttendees: [],
      createdAt: now(),
    };

    dataToCreate.imageUrl = await resolveImage(
      d.imageSource as string,
      d.imageFile instanceof File ? d.imageFile : null,
      d.imageHint as string,
      d.imageUrl as string,
      d.title as string
    );

    if (d.attachment instanceof File && (d.attachment as File).size > 0) {
      const f = d.attachment as File;
      dataToCreate.attachmentUrl = await uploadFile(f, `event_attachments/${Date.now()}_${f.name}`);
      dataToCreate.attachmentName = f.name;
    }

    await create(COL, dataToCreate);
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error('[createEvent Error]', error);
    throw new Error(`Gagal membuat acara: ${(error as Error).message}`);
  }
}

export async function updateEvent(id: string, formData: FormData) {
  try {
    const d = Object.fromEntries(formData.entries());
    const dataToUpdate: Record<string, unknown> = {
      title: d.title,
      slug: d.slug,
      description: d.description,
      location: d.location,
      visibility: d.visibility,
      submissionType: d.submissionType,
      applicationUrl: d.applicationUrl,
      formId: d.formId,
      startDate: new Date(d.dateRangeFrom as string).toISOString(),
      endDate: d.dateRangeTo ? new Date(d.dateRangeTo as string).toISOString() : null,
    };

    if (d.imageFile instanceof File && (d.imageFile as File).size > 0) {
      dataToUpdate.imageUrl = await uploadFile(
        d.imageFile as File,
        `event-images/${Date.now()}_${(d.imageFile as File).name}`
      );
    } else if (d.imageSource === 'ai' && d.imageHint) {
      dataToUpdate.imageUrl = await resolveImage('ai', null, d.imageHint as string, '', '');
    } else if (d.imageSource === 'url' && d.imageUrl) {
      dataToUpdate.imageUrl = d.imageUrl;
    }

    if (d.attachment instanceof File && (d.attachment as File).size > 0) {
      const f = d.attachment as File;
      const current = await getOne<Event>(COL, id);
      if ((current as any)?.attachmentUrl) await deleteFile((current as any).attachmentUrl);
      dataToUpdate.attachmentUrl = await uploadFile(f, `event_attachments/${Date.now()}_${f.name}`);
      dataToUpdate.attachmentName = f.name;
    }

    await update(COL, id, dataToUpdate);
    revalidatePath('/panel/events');
    revalidatePath(`/panel/events/edit/${id}`);
    revalidatePath('/events');
  } catch (error) {
    console.error('[updateEvent Error]', error);
    throw new Error(`Gagal memperbarui acara: ${(error as Error).message}`);
  }
}

export async function deleteEvent(id: string) {
  try {
    const event = await getOne<Event>(COL, id) as any;
    if (event?.attachmentUrl) await deleteFile(event.attachmentUrl);
    if (event?.imageUrl) await deleteFile(event.imageUrl);
    await remove(COL, id);
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error('[deleteEvent Error]', error);
    throw new Error('Gagal menghapus acara.');
  }
}

export async function markAttendance(
  eventId: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; message: string }> {
  const event = await getOne<Event>(COL, eventId) as any;
  if (!event) return { success: false, message: 'Acara tidak ditemukan.' };

  const attendeeIds: any[] = event.attendeeIds ?? [];
  if (attendeeIds.some((a: any) => a.userId === userId)) {
    return { success: true, message: 'Anda sudah tercatat hadir.' };
  }

  const newAttendee = { userId, userName, timestamp: now() };
  await update(COL, eventId, { attendeeIds: [...attendeeIds, newAttendee] });
  revalidatePath(`/events/${eventId}`);
  return { success: true, message: 'Kehadiran Anda berhasil dicatat!' };
}

export async function markGuestAttendance(
  eventId: string,
  guest: { name: string; email: string; phone?: string }
): Promise<void> {
  const event = await getOne<Event>(COL, eventId) as any;
  if (!event) throw new Error('Acara tidak ditemukan.');

  const guestAttendees: any[] = event.guestAttendees ?? [];
  await update(COL, eventId, {
    guestAttendees: [...guestAttendees, { ...guest, timestamp: now() }],
  });
  revalidatePath(`/events/${eventId}`);
}
