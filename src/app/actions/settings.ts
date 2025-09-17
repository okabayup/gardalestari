
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
    console.error("[getAppSettings Error]", error);
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


export async function updateAppSettings(formData: FormData) {
  try {
    const dataToUpdate: { [key: string]: any } = {};
    
    // Handle simple string and boolean fields
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && !key.endsWith('File')) {
            if(key === 'isRegistrationOpen' || key === 'isWhatsappNotificationsEnabled') {
                 dataToUpdate[key] = value === 'true';
            } else if (key.startsWith('dummy')) {
                dataToUpdate[key] = Number(value) || 0;
            }
             else {
                dataToUpdate[key] = value;
            }
        }
    }

    const imageFields: ('heroImageFile' | 'aboutImageFile' | 'orgChartImageFile')[] = ['heroImageFile', 'aboutImageFile', 'orgChartImageFile'];
    
    for(const fieldName of imageFields) {
        const file = formData.get(fieldName) as File | null;
        if (file && file.size > 0) {
            const correspondingUrlField = fieldName.replace('File', 'Url');
            const storagePath = `landing/${fieldName.replace('ImageFile', '-image.jpg')}`;
            const imageRef = ref(storage, storagePath);
            
            console.log(`[updateAppSettings] Uploading ${fieldName} to ${storagePath}`);
            await uploadBytes(imageRef, file);
            dataToUpdate[correspondingUrlField] = await getDownloadURL(imageRef);
            console.log(`[updateAppSettings] Upload successful for ${fieldName}:`, dataToUpdate[correspondingUrlField]);
        }
    }
    
    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    
    // Revalidate relevant pages
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/panel/settings');
    revalidatePath('/panel/landing');

  } catch (error) {
    console.error("[updateAppSettings Error]", error);
    throw new Error(`Gagal memperbarui pengaturan aplikasi: ${(error as Error).message}`);
  }
}
