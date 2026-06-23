'use server';

import { revalidatePath } from 'next/cache';
import type { EduwisataPackage, Addon, ShortLink } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile } from '@/lib/db';
import { createShortLink, updateShortLink, getShortLink } from '@/app/actions/shortlinks';

const COL_PACKAGES = 'edutourismPackages';
const COL_ADDONS = 'edutourismAddons';

export async function getEduwisataPackages(): Promise<EduwisataPackage[]> {
  return getAll<EduwisataPackage>(COL_PACKAGES, { orderBy: { field: 'title', direction: 'asc' } });
}

export async function getEduwisataPackage(id: string): Promise<EduwisataPackage | null> {
  if (!id) return null;
  return getOne<EduwisataPackage>(COL_PACKAGES, id);
}

export async function createEduwisataPackage(formData: FormData): Promise<string> {
  console.log("Received form data on server");
  try {
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      minParticipants: Number(formData.get('minParticipants')),
      duration: formData.get('duration') as string,
      availableAddonIds: (formData.get('availableAddonIds') as string)?.split(',') || [],
    };
    const imageFile = formData.get('imageFile') as File;
    const galleryFiles = formData.getAll('galleryFiles') as File[];

    if (!imageFile) throw new Error("Gambar utama wajib diunggah.");

    const imageUrl = await uploadFile(imageFile, `eduwisata/packages/${Date.now()}_${imageFile.name}`);
    console.log("Main image uploaded:", imageUrl);

    let galleryImageUrls: string[] = [];
    if (galleryFiles && galleryFiles.length > 0 && galleryFiles[0].size > 0) {
      for (const file of galleryFiles) {
        galleryImageUrls.push(await uploadFile(file, `eduwisata/gallery/${Date.now()}_${file.name}`));
      }
      console.log("Gallery images uploaded:", galleryImageUrls.length);
    }

    // Generate stable ID upfront so shortlink can reference it
    const packageId = crypto.randomUUID();

    const shortlinkId = await createShortLink({
      title: `Eduwisata: ${data.title}`,
      longUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/edutourism/${packageId}`,
      slug: `edu-${packageId.substring(0, 5)}`,
      type: 'edutourism',
      relatedId: packageId,
    });
    console.log("Shortlink created with ID:", shortlinkId);

    const packageData: Omit<EduwisataPackage, 'id'> = {
      ...data,
      imageUrl,
      images: galleryImageUrls,
      shortlinkId: shortlinkId,
    };
    await create(COL_PACKAGES, packageData as Record<string, unknown>, packageId);
    console.log("Package data saved with ID:", packageId);

    revalidatePath('/panel/edutourism');
    return packageId;
  } catch (error) {
    console.error("[createEduwisataPackage Error]", error);
    throw new Error(`Gagal total membuat paket: ${(error as Error).message}`);
  }
}

export async function updateEduwisataPackage(id: string, formData: FormData) {
  console.log("Received update form data on server");
  try {
    const existingPackage = await getEduwisataPackage(id);
    if (!existingPackage) throw new Error("Package not found");

    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      minParticipants: Number(formData.get('minParticipants')),
      duration: formData.get('duration') as string,
      availableAddonIds: (formData.get('availableAddonIds') as string)?.split(',') || [],
    };
    const newShortlinkSlug = formData.get('shortlinkSlug') as string | undefined;
    const imageFile = formData.get('imageFile') as File | null;
    const galleryFiles = formData.getAll('galleryFiles') as File[];

    const dataToUpdate: Record<string, unknown> = { ...data };

    if (imageFile && imageFile.size > 0) {
      console.log("Uploading new main image...");
      dataToUpdate.imageUrl = await uploadFile(imageFile, `eduwisata/packages/${Date.now()}_${imageFile.name}`);
      console.log("New main image URL:", dataToUpdate.imageUrl);
    }

    if (galleryFiles && galleryFiles.length > 0 && galleryFiles[0].size > 0) {
      console.log(`Uploading ${galleryFiles.length} new gallery images...`);
      const newImageUrls: string[] = [];
      for (const file of galleryFiles) {
        newImageUrls.push(await uploadFile(file, `eduwisata/gallery/${Date.now()}_${file.name}`));
      }
      dataToUpdate.images = [...((existingPackage as any).images || []), ...newImageUrls];
      console.log("New gallery URLs:", newImageUrls);
    }

    await update(COL_PACKAGES, id, dataToUpdate);

    if (existingPackage.shortlinkId) {
      const existingShortlink = await getShortLink(existingPackage.shortlinkId);
      const updates: Partial<ShortLink> = {};
      if (data.title !== existingPackage.title) {
        updates.title = `Eduwisata: ${data.title}`;
      }
      if (newShortlinkSlug && newShortlinkSlug !== existingShortlink?.slug) {
        updates.slug = newShortlinkSlug;
      }
      if (Object.keys(updates).length > 0) {
        await updateShortLink(existingPackage.shortlinkId, updates);
      }
    }

    console.log("Document updated successfully.");
    revalidatePath('/panel/edutourism');
    revalidatePath(`/panel/edutourism/edit/${id}`);
  } catch (error) {
    console.error("[updateEduwisataPackage Error]", error);
    throw new Error(`Gagal total memperbarui paket: ${(error as Error).message}`);
  }
}

export async function deleteEduwisataPackage(id: string) {
  // TODO: Also delete images from storage and associated shortlink
  await remove(COL_PACKAGES, id);
  revalidatePath('/panel/edutourism');
}

// --- Addon Management ---

export async function getAddons(): Promise<Addon[]> {
  return getAll<Addon>(COL_ADDONS, { orderBy: { field: 'name', direction: 'asc' } });
}

export async function createAddon(data: Omit<Addon, 'id'>) {
  await create(COL_ADDONS, data as Record<string, unknown>);
  revalidatePath('/panel/edutourism/addons');
}

export async function updateAddon(id: string, data: Partial<Omit<Addon, 'id'>>) {
  await update(COL_ADDONS, id, data as Record<string, unknown>);
  revalidatePath('/panel/edutourism/addons');
}

export async function deleteAddon(id: string) {
  await remove(COL_ADDONS, id);
  revalidatePath('/panel/edutourism/addons');
}
