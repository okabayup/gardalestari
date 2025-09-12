
'use server';

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { AppSettings } from '@/lib/definitions';

const settingsDocRef = doc(db, 'settings', 'global');

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Provide defaults for all fields, including new dummy fields
      return {
        isRegistrationOpen: true,
        isWhatsappNotificationsEnabled: false,
        linkedin: '#',
        instagram: '#',
        twitter: '#',
        facebook: '#',
        heroImageUrl: 'https://picsum.photos/seed/paddy-field/1920/1080',
        aboutImageUrl: 'https://picsum.photos/seed/youth-farmers/800/600',
        orgChartImageUrl: 'https://picsum.photos/seed/org-chart/1200/1600',
        dummyMembers: 0,
        dummyPrograms: 0,
        dummyEvents: 0,
        dummyNews: 0,
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
    isWhatsappNotificationsEnabled: false,
    heroImageUrl: 'https://picsum.photos/seed/paddy-field/1920/1080',
    aboutImageUrl: 'https://picsum.photos/seed/youth-farmers/800/600',
    orgChartImageUrl: 'https://picsum.photos/seed/org-chart/1200/1600',
    dummyMembers: 0,
    dummyPrograms: 0,
    dummyEvents: 0,
    dummyNews: 0,
  };
}


export async function updateAppSettings(settings: Partial<Omit<AppSettings, 'heroImageUrl' | 'aboutImageUrl' | 'orgChartImageUrl'>> & { heroImageFile?: File, aboutImageFile?: File, orgChartImageFile?: File }) {
  try {
    const dataToUpdate: { [key: string]: any } = { ...settings };

    // Convert dummy numbers to actual numbers before saving
    dataToUpdate.dummyMembers = Number(settings.dummyMembers) || 0;
    dataToUpdate.dummyPrograms = Number(settings.dummyPrograms) || 0;
    dataToUpdate.dummyEvents = Number(settings.dummyEvents) || 0;
    dataToUpdate.dummyNews = Number(settings.dummyNews) || 0;
    
    if (settings.heroImageFile) {
        const heroImageRef = ref(storage, 'landing/hero-image.jpg');
        await uploadBytes(heroImageRef, settings.heroImageFile);
        dataToUpdate.heroImageUrl = await getDownloadURL(heroImageRef);
    }
    delete dataToUpdate.heroImageFile;


    if (settings.aboutImageFile) {
        const aboutImageRef = ref(storage, 'landing/about-image.jpg');
        await uploadBytes(aboutImageRef, settings.aboutImageFile);
        dataToUpdate.aboutImageUrl = await getDownloadURL(aboutImageRef);
    }
    delete dataToUpdate.aboutImageFile;
    
    if (settings.orgChartImageFile) {
        const orgChartImageRef = ref(storage, 'landing/org-chart-image.jpg');
        await uploadBytes(orgChartImageRef, settings.orgChartImageFile);
        dataToUpdate.orgChartImageUrl = await getDownloadURL(orgChartImageRef);
    }
    delete dataToUpdate.orgChartImageFile;


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
