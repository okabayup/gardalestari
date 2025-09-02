
'use server';

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

export interface AppSettings {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  isRegistrationOpen: boolean;
  heroImageUrl: string;
  aboutImageUrl: string;
}

const settingsDocRef = doc(db, 'settings', 'global');

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isRegistrationOpen: true,
        linkedin: '#',
        instagram: '#',
        twitter: '#',
        facebook: '#',
        heroImageUrl: 'https://picsum.photos/seed/paddy-field/1920/1080',
        aboutImageUrl: 'https://picsum.photos/seed/youth-farmers/800/600',
        ...data,
      } as AppSettings;
    }
  } catch (error) {
    console.error("Error fetching app settings:", error);
  }
  // Return default values if not set or on error
  return {
    linkedin: '#',
    instagram: '#',
    twitter: '#',
    facebook: '#',
    isRegistrationOpen: true,
    heroImageUrl: 'https://picsum.photos/seed/paddy-field/1920/1080',
    aboutImageUrl: 'https://picsum.photos/seed/youth-farmers/800/600',
  };
}


export async function updateAppSettings(settings: Partial<Omit<AppSettings, 'heroImageUrl' | 'aboutImageUrl'>> & { heroImageFile?: File, aboutImageFile?: File }) {
  try {
    const dataToUpdate: { [key: string]: any } = { ...settings };
    
    if (settings.heroImageFile) {
        const heroImageRef = ref(storage, 'landing/hero-image.jpg');
        await uploadBytes(heroImageRef, settings.heroImageFile);
        dataToUpdate.heroImageUrl = await getDownloadURL(heroImageRef);
        delete dataToUpdate.heroImageFile;
    }

    if (settings.aboutImageFile) {
        const aboutImageRef = ref(storage, 'landing/about-image.jpg');
        await uploadBytes(aboutImageRef, settings.aboutImageFile);
        dataToUpdate.aboutImageUrl = await getDownloadURL(aboutImageRef);
        delete dataToUpdate.aboutImageFile;
    }


    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    
    // Revalidate relevant pages
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/panel/settings');
    revalidatePath('/panel/landing');

  } catch (error) {
    console.error("Error updating app settings:", error);
    throw new Error("Gagal memperbarui pengaturan aplikasi.");
  }
}
