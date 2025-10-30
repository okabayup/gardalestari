

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { EduwisataPackage, Addon } from '@/lib/definitions';
import { createShortLink, updateShortLink, getShortLink } from '@/app/actions/shortlinks';
import { SHORTLINK_DOMAIN } from '@/lib/definitions';

const packagesCollection = collection(db, 'edutourismPackages');
const addonsCollection = collection(db, 'edutourismAddons');

// --- Package Management ---

export async function getEduwisataPackages(): Promise<EduwisataPackage[]> {
  const snapshot = await getDocs(query(packagesCollection, orderBy('title', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EduwisataPackage));
}

export async function getEduwisataPackage(id: string): Promise<EduwisataPackage | null> {
  if (!id) {
    return null;
  }
  const docRef = doc(db, 'edutourismPackages', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as EduwisataPackage : null;
}

export async function createEduwisataPackage(
  formData: FormData,
): Promise<string> {
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

    if (!imageFile) {
        throw new Error("Gambar utama wajib diunggah.");
    }

    const imageRef = ref(storage, `eduwisata/packages/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);
    console.log("Main image uploaded:", imageUrl);

    let galleryImageUrls: string[] = [];
    if (galleryFiles && galleryFiles.length > 0 && galleryFiles[0].size > 0) {
        for (const file of galleryFiles) {
            const galleryImageRef = ref(storage, `eduwisata/gallery/${Date.now()}_${file.name}`);
            await uploadBytes(galleryImageRef, file);
            galleryImageUrls.push(await getDownloadURL(galleryImageRef));
        }
        console.log("Gallery images uploaded:", galleryImageUrls.length);
    }
    
    const docRef = doc(collection(db, 'edutourismPackages'));
    
    // Create the shortlink first to get its ID
    const shortlinkId = await createShortLink({
        title: `Eduwisata: ${data.title}`,
        longUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/edutourism/${docRef.id}`,
        slug: `edu-${docRef.id.substring(0, 5)}`,
        type: 'edutourism',
        relatedId: docRef.id,
    });
    console.log("Shortlink created with ID:", shortlinkId);
    
    const packageData: Omit<EduwisataPackage, 'id'> = {
        ...data,
        imageUrl,
        images: galleryImageUrls,
        shortlinkId: shortlinkId,
    };
    await setDoc(docRef, packageData);
    console.log("Package data saved to Firestore with ID:", docRef.id);

    revalidatePath('/panel/edutourism');
    return docRef.id;

  } catch (error) {
    console.error("[createEduwisataPackage Error]", "Failed to create package. Full error:", error);
    throw new Error(`Gagal total membuat paket: ${(error as Error).message}`);
  }
}


export async function updateEduwisataPackage(
  id: string,
  formData: FormData,
) {
  console.log("Received update form data on server");
  try {
    const docRef = doc(db, 'edutourismPackages', id);
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

    const dataToUpdate: { [key: string]: any } = { ...data };
    
    if (imageFile && imageFile.size > 0) {
      console.log("Uploading new main image...");
      const imageRef = ref(storage, `eduwisata/packages/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      dataToUpdate.imageUrl = await getDownloadURL(imageRef);
      console.log("New main image URL:", dataToUpdate.imageUrl);
    }

    if (galleryFiles && galleryFiles.length > 0 && galleryFiles[0].size > 0) {
      console.log(`Uploading ${galleryFiles.length} new gallery images...`);
      const newImageUrls: string[] = [];
      for (const file of galleryFiles) {
        const galleryImageRef = ref(storage, `eduwisata/gallery/${Date.now()}_${file.name}`);
        await uploadBytes(galleryImageRef, file);
        newImageUrls.push(await getDownloadURL(galleryImageRef));
      }
      dataToUpdate.images = [...(existingPackage.images || []), ...newImageUrls];
      console.log("New gallery URLs:", newImageUrls);
    }


    await updateDoc(docRef, dataToUpdate);
    
    // Sync shortlink title and slug
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


    console.log("Firestore document updated successfully.");
    revalidatePath('/panel/edutourism');
    revalidatePath(`/panel/edutourism/edit/${id}`);
  } catch (error) {
      console.error("[updateEduwisataPackage Error]", "Failed to update package. Full error:", error);
      throw new Error(`Gagal total memperbarui paket: ${(error as Error).message}`);
  }
}


export async function deleteEduwisataPackage(id: string) {
  const docRef = doc(db, 'edutourismPackages', id);
  // TODO: Also delete images from storage and associated shortlink
  await deleteDoc(docRef);
  revalidatePath('/panel/edutourism');
}


// --- Addon Management ---

export async function getAddons(): Promise<Addon[]> {
  const addonsCollectionRef = collection(db, 'edutourismAddons');
  const snapshot = await getDocs(query(addonsCollectionRef, orderBy('name', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
}

export async function createAddon(data: Omit<Addon, 'id'>) {
  const addonsCollectionRef = collection(db, 'edutourismAddons');
  await addDoc(addonsCollectionRef, data);
  revalidatePath('/panel/edutourism/addons');
}

export async function updateAddon(id: string, data: Partial<Omit<Addon, 'id'>>) {
  const docRef = doc(db, 'edutourismAddons', id);
  await updateDoc(docRef, data);
  revalidatePath('/panel/edutourism/addons');
}

export async function deleteAddon(id: string) {
  const docRef = doc(db, 'edutourismAddons', id);
  await deleteDoc(docRef);
  revalidatePath('/panel/edutourism/addons');
}

