'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface BeritaPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  date: string; // Consider using a Firestore timestamp
  imageUrl: string;
  imageHint: string;
  excerpt: string;
}

const beritaPostsCollection = collection(db, 'beritaPosts');

// Get all berita posts
export async function getBeritaPosts() {
  const snapshot = await getDocs(beritaPostsCollection);
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
    await addDoc(beritaPostsCollection, post);
    revalidatePath('/admin/berita');
    revalidatePath('/berita');
  } catch (error) {
    console.error("Error creating berita post:", error);
    throw new Error("Gagal membuat berita.");
  }
}

// Update an existing berita post
export async function updateBeritaPost(id: string, post: Partial<BeritaPost>) {
  try {
    const postDoc = doc(db, 'beritaPosts', id);
    await updateDoc(postDoc, post);
    revalidatePath('/admin/berita');
    revalidatePath(`/admin/berita/edit/${post.slug}`);
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
    revalidatePath('/admin/berita');
    revalidatePath('/berita');
  } catch (error) {
    console.error("Error deleting berita post:", error);
    throw new Error("Gagal menghapus berita.");
  }
}
