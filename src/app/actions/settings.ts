
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface SocialMediaLinks {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
}

const settingsDocRef = doc(db, 'settings', 'socialMedia');

export async function getSocialMediaLinks(): Promise<SocialMediaLinks> {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as SocialMediaLinks;
    }
  } catch (error) {
    console.error("Error fetching social media links:", error);
  }
  // Return default empty values if not set or on error
  return {
    linkedin: '#',
    instagram: '#',
    twitter: '#',
    facebook: '#',
  };
}

export async function updateSocialMediaLinks(links: SocialMediaLinks) {
  try {
    await setDoc(settingsDocRef, links, { merge: true });
    // Revalidate the landing page to show new links
    revalidatePath('/');
  } catch (error) {
    console.error("Error updating social media links:", error);
    throw new Error("Gagal memperbarui tautan media sosial.");
  }
}
