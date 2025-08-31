
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface AppSettings {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  isRegistrationOpen: boolean;
}

const settingsDocRef = doc(db, 'settings', 'global');

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      // Ensure default for isRegistrationOpen if it doesn't exist
      const data = docSnap.data();
      return {
        isRegistrationOpen: true, // Default to open
        linkedin: '#',
        instagram: '#',
        twitter: '#',
        facebook: '#',
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
    isRegistrationOpen: true, // Default to open
  };
}

export async function updateAppSettings(settings: Partial<AppSettings>) {
  try {
    await setDoc(settingsDocRef, settings, { merge: true });
    // Revalidate relevant pages
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/admin/settings');

  } catch (error) {
    console.error("Error updating app settings:", error);
    throw new Error("Gagal memperbarui pengaturan aplikasi.");
  }
}
