
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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
    await addDoc(beritaPostsCollection, postData);
    revalidatePath('/panel/berita');
    revalidatePath('/berita');
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
  } catch (error) {
    console.error("Error updating berita post:", error);
    throw new Error("Gagal memperbarui berita.");
  }
}

// Delete a berita post
export async function deleteBeritaPost(id: string) {
  try {
    const postDoc = doc(db, 'beritaPosts', id);
    await deleteDoc(postDoc);
    revalidatePath('/panel/berita');
    revalidatePath('/berita');
  } catch (error) {
    console.error("Error deleting berita post:", error);
    throw new Error("Gagal menghapus berita.");
  }
}
