
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { notifyGoogleOfUpdate } from '@/services/indexing';

export interface BeritaPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  date: string; 
  imageUrl: string;
  imageHint: string;
  excerpt: string;
  category: string; // New field
}

const beritaPostsCollection = collection(db, 'beritaPosts');
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gardalestari.org';

// Get all berita posts
export async function getBeritaPosts() {
  const q = query(beritaPostsCollection, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  const posts: BeritaPost[] = [];
  snapshot.forEach(doc => {
    posts.push({ id: doc.id, ...doc.data() } as BeritaPost);
  });
  return posts;
}

// Get a single berita post by slug
export async function getBeritaPost(slug: string) {
  const q = query(beritaPostsCollection, where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as BeritaPost;
}


// Create a new berita post
export async function createBeritaPost(post: Omit<BeritaPost, 'id'>) {
  try {
    // Firestore does not allow undefined values. Ensure all fields have a fallback.
    const postData = {
      title: post.title || 'Judul Default',
      slug: post.slug || 'slug-default',
      content: post.content || '<p>Konten default.</p>',
      author: post.author || 'Admin',
      date: post.date || new Date().toISOString(),
      imageUrl: post.imageUrl || '',
      imageHint: post.imageHint || '',
      excerpt: post.excerpt || '',
      category: post.category || 'Umum'
    };
    const docRef = await addDoc(beritaPostsCollection, postData);
    revalidatePath('/panel/berita');
    revalidatePath('/berita');
    
    // Notify Google Indexing API
    const publicUrl = `${BASE_URL}/berita/${postData.slug}`;
    await notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');

    return { id: docRef.id, ...postData };

  } catch (error) {
    console.error("Error creating berita post:", error);
    // Include the original error message for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal membuat berita. Pastikan semua data terisi dengan benar. Error: ${errorMessage}`);
  }
}

// Update an existing berita post
export async function updateBeritaPost(id: string, post: Partial<BeritaPost>) {
  try {
    const postDoc = doc(db, 'beritaPosts', id);
    await updateDoc(postDoc, post);
    revalidatePath('/panel/berita');
    revalidatePath(`/panel/berita/edit/${post.slug}`);
    revalidatePath('/berita');
    if (post.slug) {
        revalidatePath(`/berita/${post.slug}`);
    }

    // Notify Google Indexing API
    if (post.slug) {
      const publicUrl = `${BASE_URL}/berita/${post.slug}`;
      await notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
    }

  } catch (error) {
    console.error("Error updating berita post:", error);
    throw new Error("Gagal memperbarui berita.");
  }
}

// Delete a berita post
export async function deleteBeritaPost(id: string) {
  try {
    const postDocRef = doc(db, 'beritaPosts', id);
    const postToDelete = await getDoc(postDocRef);

    if (!postToDelete.exists()) {
        throw new Error("Berita tidak ditemukan.");
    }
    
    const postData = postToDelete.data() as BeritaPost;
    const publicUrl = `${BASE_URL}/berita/${postData.slug}`;

    await deleteDoc(postDocRef);
    revalidatePath('/panel/berita');
    revalidatePath('/berita');

    // Notify Google Indexing API
    await notifyGoogleOfUpdate(publicUrl, 'URL_DELETED');

  } catch (error) {
    console.error("Error deleting berita post:", error);
    throw new Error("Gagal menghapus berita.");
  }
}

// Action to manually request re-indexing
export async function requestReindexing(slug: string) {
    try {
        const publicUrl = `${BASE_URL}/berita/${slug}`;
        const result = await notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
        if (result.success) {
            return { message: `Permintaan indeksasi untuk ${slug} berhasil dikirim.` };
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        console.error("Error requesting re-indexing:", error);
        throw new Error("Gagal meminta indeksasi ulang.");
    }
}
