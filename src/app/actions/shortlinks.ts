'use server';

import { revalidatePath } from 'next/cache';
import type { ShortLink } from '@/lib/definitions';
import { getAll, getOne, getFirst, create, update, remove, set, now } from '@/lib/db';
import { getEduwisataPackages } from './edutourism';

const COL = 'shortlinks';

export async function createShortLink(
  data: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>
): Promise<string> {
  try {
    const existing = await getFirst(COL, {
      where: { field: 'slug', op: '==', value: data.slug },
    });
    if (existing) throw new Error(`Shortlink dengan slug "${data.slug}" sudah ada.`);

    const id = await create(COL, { ...data, clicks: 0, createdAt: now() });
    revalidatePath('/panel/shortlinks');
    return id;
  } catch (error) {
    console.error('Error creating shortlink:', error);
    throw new Error(`Gagal membuat shortlink: ${(error as Error).message}`);
  }
}

export async function createMeetingShortLink() {
  try {
    const existing = await getFirst(COL, {
      where: { field: 'slug', op: '==', value: 'meet' },
    });
    if (!existing) {
      await createShortLink({
        title: 'Jadwalkan Meeting',
        slug: 'meet',
        longUrl: '/booking/meeting',
        type: 'custom',
      });
    }
  } catch (error) {
    console.error('Failed to create meeting shortlink:', error);
  }
}

export async function updateShortLink(
  id: string,
  data: Partial<Omit<ShortLink, 'id' | 'createdAt' | 'clicks' | 'type'>>
) {
  try {
    const current = await getOne<ShortLink>(COL, id);
    if (!current) throw new Error('Shortlink tidak ditemukan.');

    if (data.slug && data.slug !== current.slug) {
      const duplicate = await getFirst(COL, {
        where: { field: 'slug', op: '==', value: data.slug },
      });
      if (duplicate && (duplicate as any).id !== id) {
        throw new Error(`Shortlink dengan slug "${data.slug}" sudah ada.`);
      }
    }

    await update(COL, id, data as Record<string, unknown>);

    // Sync slug change to related edutourism package
    if (data.slug && data.slug !== current.slug && (current as any).relatedId && current.type === 'edutourism') {
      await update('edutourismPackages', (current as any).relatedId, { shortlinkSlug: data.slug });
      revalidatePath(`/panel/edutourism/edit/${(current as any).relatedId}`);
    }

    revalidatePath('/panel/shortlinks');
  } catch (error) {
    console.error('Error updating shortlink:', error);
    throw new Error(`Gagal memperbarui shortlink: ${(error as Error).message}`);
  }
}

export async function getShortLinks(): Promise<ShortLink[]> {
  return await getAll<ShortLink>(COL, {
    orderBy: { field: 'createdAt', direction: 'desc' },
  });
}

export async function getShortLink(slug: string): Promise<ShortLink | null> {
  if (!slug) return null;
  try {
    return await getFirst<ShortLink>(COL, {
      where: { field: 'slug', op: '==', value: slug },
    });
  } catch (error) {
    console.error(`Error getting shortlink for slug ${slug}:`, error);
    return null;
  }
}

export async function deleteShortLink(id: string): Promise<void> {
  try {
    await remove(COL, id);
    revalidatePath('/panel/shortlinks');
  } catch (error) {
    console.error('Error deleting shortlink:', error);
    throw new Error('Gagal menghapus shortlink.');
  }
}

export async function incrementClickCount(slug: string): Promise<void> {
  try {
    const link = await getFirst<ShortLink>(COL, {
      where: { field: 'slug', op: '==', value: slug },
    }) as any;
    if (link?.id) {
      await update(COL, link.id, { clicks: (link.clicks ?? 0) + 1 });
    }
  } catch (error) {
    console.error(`Failed to increment click count for ${slug}:`, error);
  }
}

export async function syncShortlinks(): Promise<{ created: number; updated: number; message: string }> {
  let created = 0;
  let updated = 0;

  try {
    const [packages, shortlinks] = await Promise.all([
      getEduwisataPackages(),
      getShortLinks(),
    ]);

    const shortlinksMap = new Map(shortlinks.map(l => [(l as any).id, l]));

    for (const pkg of packages) {
      const expectedUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/edutourism/${pkg.id}`;
      const expectedTitle = `Eduwisata: ${pkg.title}`;

      if ((pkg as any).shortlinkId && shortlinksMap.has((pkg as any).shortlinkId)) {
        const existing = shortlinksMap.get((pkg as any).shortlinkId)!;
        const updates: Partial<ShortLink> = {};
        if (existing.title !== expectedTitle) updates.title = expectedTitle;
        if (existing.longUrl !== expectedUrl) updates.longUrl = expectedUrl;
        if (Object.keys(updates).length > 0) {
          await updateShortLink((existing as any).id!, updates);
          updated++;
        }
      } else {
        const shortlinkId = await createShortLink({
          title: expectedTitle,
          longUrl: expectedUrl,
          slug: `edu-${pkg.id.substring(0, 5)}`,
          type: 'edutourism',
          relatedId: pkg.id,
        });
        await update('edutourismPackages', pkg.id, { shortlinkId });
        created++;
      }
    }

    revalidatePath('/panel/shortlinks');
    revalidatePath('/panel/edutourism');
    return { created, updated, message: `Sinkronisasi selesai: ${created} dibuat, ${updated} diperbarui.` };
  } catch (error) {
    console.error('[syncShortlinks Error]', error);
    throw new Error('Gagal melakukan sinkronisasi shortlink.');
  }
}
