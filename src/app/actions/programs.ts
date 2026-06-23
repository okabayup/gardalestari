'use server';

import { revalidatePath } from 'next/cache';
import { getWhatsappTemplate } from '@/app/actions/settings';
import { sendBulkWhatsAppMessage } from '@/services/whatsapp';
export type { Program, ProgramFormData, ProgramTag } from '@/lib/definitions';
import type { Program, ProgramFormData, ProgramTag } from '@/lib/definitions';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { sendNotification } from '@/app/actions/notifications';
import { getMembers } from '@/app/actions/user';
import { getAll, getOne, create, update, remove, uploadFile, deleteFile, now } from '@/lib/db';

const COL = 'programs';
const COL_TAGS = 'programTags';

// Helper: convert ISO string dates back to Date objects for Program type compatibility
const toProgram = (data: any): Program => ({
  ...data,
  startDate: data.startDate ? new Date(data.startDate) : new Date(),
  endDate: data.endDate ? new Date(data.endDate) : undefined,
}) as Program;

// === Public Functions for AI Tool ===

export async function searchPrograms(searchQuery: string): Promise<Partial<Program>[]> {
  try {
    const all = await getAll<any>(COL, {
      orderBy: { field: 'endDate', direction: 'desc' },
      limit: 10,
    });

    const searchTerms = searchQuery.toLowerCase().split(' ');
    const results = all
      .filter((entry: any) => {
        const searchableText = `${entry.title} ${entry.description} ${(entry.tags || []).join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      })
      .slice(0, 5);

    return results.map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      endDate: entry.endDate ? new Date(entry.endDate) : undefined,
      category: entry.category,
    }));
  } catch (error) {
    console.error("[searchPrograms Error]", error);
    throw new Error("Gagal mencari data program.");
  }
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const rows = await getAll<any>(COL, { orderBy: { field: 'startDate', direction: 'desc' } });
    return rows.map(toProgram);
  } catch (error) {
    console.error("[getPrograms Error]", error);
    throw new Error("Gagal mengambil data program.");
  }
}

export async function getProgram(id: string): Promise<Program | null> {
  try {
    const row = await getOne<any>(COL, id);
    return row ? toProgram(row) : null;
  } catch (error) {
    console.error("[getProgram Error]", error);
    throw new Error("Gagal mengambil data program.");
  }
}

export async function createProgram(formData: FormData): Promise<string> {
  try {
    const programData = Object.fromEntries(formData.entries());
    const { imageFile, attachment, dateRangeFrom, dateRangeTo, tags, isUnlimited, ...rest } = programData;

    const dataToCreate: Record<string, any> = {
      ...rest,
      tags: Array.isArray(tags) ? tags : (tags as string).split(','),
      startDate: new Date(dateRangeFrom as string).toISOString(),
      createdAt: now(),
    };

    if (isUnlimited === 'true') {
      dataToCreate.endDate = null;
    } else if (dateRangeTo) {
      dataToCreate.endDate = new Date(dateRangeTo as string).toISOString();
    }

    if (programData.imageSource === 'upload' && imageFile instanceof File) {
      dataToCreate.imageUrl = await uploadFile(imageFile, `program-images/${Date.now()}_${imageFile.name}`);
    } else if (programData.imageSource === 'ai' && typeof programData.imageHint === 'string' && programData.imageHint) {
      const result = await generateImage({ prompt: programData.imageHint });
      if (!result.imageUrl) throw new Error("AI gagal membuat URL gambar.");

      if (result.imageUrl.startsWith('data:')) {
        const buf = Buffer.from(result.imageUrl.split(',')[1], 'base64');
        dataToCreate.imageUrl = await uploadFile(buf, `program-images/${Date.now()}_ai_generated.png`);
      } else {
        dataToCreate.imageUrl = result.imageUrl;
      }
    } else if (programData.imageSource === 'url' && typeof programData.imageUrl === 'string' && programData.imageUrl) {
      dataToCreate.imageUrl = programData.imageUrl;
    } else {
      dataToCreate.imageUrl = `https://picsum.photos/seed/${programData.title}/600/400`;
    }

    if (attachment instanceof File) {
      dataToCreate.attachmentUrl = await uploadFile(attachment, `program_attachments/${Date.now()}_${attachment.name}`);
      dataToCreate.attachmentName = attachment.name;
    }

    const programId = await create(COL, dataToCreate);

    if (programData.programType === 'aktif') {
      try {
        await sendNotification(
          {
            title: `Program Baru: ${dataToCreate.title}`,
            body: `Pendaftaran untuk program "${dataToCreate.title}" telah dibuka. Cek sekarang!`,
            link: `/programs/${programId}`,
          },
          { type: 'all' }
        );
      } catch (e) { console.warn("[createProgram Warn] Gagal mengirim notifikasi:", e); }

      try {
        const template = await getWhatsappTemplate('new_program_announcement');
        if (template.isActive && dateRangeTo) {
          const members = await getMembers();
          const phoneNumbers = members.map((m: any) => m.waNumber).filter(Boolean) as string[];
          if (phoneNumbers.length > 0) {
            const message = template.message
              .replace('{namaProgram}', dataToCreate.title)
              .replace('{batasWaktu}', new Date(dateRangeTo as string).toLocaleDateString('id-ID'));
            await sendBulkWhatsAppMessage(phoneNumbers, message);
          }
        }
      } catch (error) { console.warn("[createProgram Warn] Gagal mengirim notifikasi WhatsApp:", error); }
    }

    revalidatePath('/panel/programs');
    revalidatePath('/programs');
    revalidatePath(`/programs/${programId}`);

    return programId;
  } catch (error) {
    console.error('[createProgram Error]', error);
    throw new Error(`Gagal total membuat program: ${(error as Error).message}`);
  }
}

export async function updateProgram(id: string, formData: FormData) {
  try {
    const programData = Object.fromEntries(formData.entries());
    const { imageFile, attachment, dateRangeFrom, dateRangeTo, tags, isUnlimited, ...rest } = programData;

    const dataToUpdate: Record<string, any> = {
      ...rest,
      tags: Array.isArray(tags) ? tags : (tags as string).split(','),
    };

    if (dateRangeFrom) dataToUpdate.startDate = new Date(dateRangeFrom as string).toISOString();

    if (isUnlimited === 'true') {
      dataToUpdate.endDate = null;
    } else if (dateRangeTo) {
      dataToUpdate.endDate = new Date(dateRangeTo as string).toISOString();
    }

    if (imageFile instanceof File) {
      dataToUpdate.imageUrl = await uploadFile(imageFile, `program-images/${Date.now()}_${imageFile.name}`);
    }

    if (attachment instanceof File) {
      const currentProgram = await getProgram(id);
      if (currentProgram?.attachmentUrl) {
        try {
          await deleteFile(currentProgram.attachmentUrl as any);
        } catch (e) {
          console.warn("[updateProgram Warn] Could not delete old attachment:", e);
        }
      }
      dataToUpdate.attachmentUrl = await uploadFile(attachment, `program_attachments/${Date.now()}_${attachment.name}`);
      dataToUpdate.attachmentName = attachment.name;
    }

    await update(COL, id, dataToUpdate);

    revalidatePath('/panel/programs');
    revalidatePath(`/panel/programs/edit/${id}`);
    revalidatePath('/programs');
    revalidatePath(`/programs/${id}`);
  } catch (error) {
    console.error("[updateProgram Error]", error);
    throw new Error("Gagal memperbarui program. " + (error as Error).message);
  }
}

export async function deleteProgram(id: string) {
  try {
    const programToDelete = await getProgram(id);
    await remove(COL, id);

    if ((programToDelete as any)?.attachmentUrl) {
      try { await deleteFile((programToDelete as any).attachmentUrl); } catch {}
    }
    if ((programToDelete as any)?.imageUrl) {
      try { await deleteFile((programToDelete as any).imageUrl); } catch {}
    }

    revalidatePath('/panel/programs');
    revalidatePath('/programs');
  } catch (error) {
    console.error("[deleteProgram Error]", error);
    throw new Error("Gagal menghapus program.");
  }
}

// --- Tag Management ---

export async function getProgramTags(): Promise<ProgramTag[]> {
  try {
    return await getAll<ProgramTag>(COL_TAGS, { orderBy: { field: 'name', direction: 'asc' } });
  } catch (error) {
    console.error("[getProgramTags Error]", error);
    throw new Error("Gagal mengambil data tag.");
  }
}

export async function addProgramTag(name: string) {
  try {
    await create(COL_TAGS, { name });
    revalidatePath('/panel/programs/tags');
  } catch (error) {
    console.error("[addProgramTag Error]", error);
    throw new Error("Gagal menambahkan tag baru.");
  }
}

export async function deleteProgramTag(id: string) {
  try {
    await remove(COL_TAGS, id);
    revalidatePath('/panel/programs/tags');
  } catch (error) {
    console.error("[deleteProgramTag Error]", error);
    throw new Error("Gagal menghapus tag.");
  }
}
