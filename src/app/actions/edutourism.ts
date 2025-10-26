
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { EduwisataPackage, Addon } from '@/lib/definitions';
import { createShortLink } from '@/app/actions/shortlinks';
import { SHORTLINK_DOMAIN } from '@/lib/definitions';

const packagesCollection = collection(db, 'edutourismPackages');
const addonsCollection = collection(db, 'edutourismAddons');

// --- Package Management ---

export async function getEduwisataPackages(): Promise<EduwisataPackage[]> {
  const snapshot = await getDocs(query(packagesCollection, orderBy('title', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EduwisataPackage));
}

export async function getEduwisataPackage(id: string): Promise<EduwisataPackage | null> {
  const docRef = doc(db, 'edutourismPackages', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as EduwisataPackage : null;
}

export async function createEduwisataPackage(
  formData: FormData,
): Promise<string> {
    const data = Object.fromEntries(formData.entries());
    const imageFile = formData.get('imageFile') as File;
    const galleryFiles = formData.getAll('galleryFiles') as File[];

    // 1. Upload main image
    const imageRef = ref(storage, `eduwisata/packages/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    // 2. Upload gallery images if any
    let galleryImageUrls: string[] = [];
    if (galleryFiles && galleryFiles[0].size > 0) {
        for (const file of galleryFiles) {
            const galleryImageRef = ref(storage, `eduwisata/gallery/${Date.now()}_${file.name}`);
            await uploadBytes(galleryImageRef, file);
            galleryImageUrls.push(await getDownloadURL(galleryImageRef));
        }
    }

    const docRef = doc(collection(db, 'edutourismPackages'));

    // 3. Create a shortlink
    const shortlinkSlug = `edu-${docRef.id.substring(0, 5)}`;
    await createShortLink({
        title: `Eduwisata: ${data.title}`,
        longUrl: `/edutourism/${docRef.id}`,
        slug: shortlinkSlug,
        type: 'edutourism',
        relatedId: docRef.id
    });

    // 4. Create package document
    const packageData: Omit<EduwisataPackage, 'id'> = {
        title: data.title as string,
        description: data.description as string,
        price: Number(data.price),
        duration: data.duration as string,
        availableAddonIds: (data.availableAddonIds as string)?.split(',') || [],
        imageUrl,
        images: galleryImageUrls,
        shortlinkSlug,
    };
    await setDoc(docRef, packageData);

    revalidatePath('/panel/edutourism');
    return docRef.id;
}


export async function updateEduwisataPackage(
  id: string,
  data: Partial<Omit<EduwisataPackage, 'id' | 'imageUrl' | 'images'>>,
  imageFile?: File,
  galleryFiles?: FileList
) {
  const docRef = doc(db, 'edutourismPackages', id);
  const dataToUpdate: { [key: string]: any } = { ...data };

  if (imageFile) {
    const imageRef = ref(storage, `eduwisata/packages/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    dataToUpdate.imageUrl = await getDownloadURL(imageRef);
  }

  if (galleryFiles && galleryFiles.length > 0) {
    const existingPackage = await getEduwisataPackage(id);
    const galleryImageUrls: string[] = existingPackage?.images || [];
    for (const file of Array.from(galleryFiles)) {
      const galleryImageRef = ref(storage, `eduwisata/gallery/${Date.now()}_${file.name}`);
      await uploadBytes(galleryImageRef, file);
      galleryImageUrls.push(await getDownloadURL(galleryImageRef));
    }
    dataToUpdate.images = galleryImageUrls;
  }

  await updateDoc(docRef, dataToUpdate);
  revalidatePath('/panel/edutourism');
  revalidatePath(`/panel/edutourism/edit/${id}`);
}


export async function deleteEduwisataPackage(id: string) {
  const docRef = doc(db, 'edutourismPackages', id);
  // TODO: Also delete images from storage and associated shortlink
  await deleteDoc(docRef);
  revalidatePath('/panel/edutourism');
}


// --- Addon Management ---

export async function getAddons(): Promise<Addon[]> {
  const snapshot = await getDocs(query(addonsCollection, orderBy('name', 'asc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
}

export async function createAddon(data: Omit<Addon, 'id'>) {
  await addDoc(addonsCollection, data);
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
