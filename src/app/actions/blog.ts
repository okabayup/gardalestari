
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface BlogPost {
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

const blogPostsCollection = collection(db, 'blogPosts');

// Get all blog posts
export async function getBlogPosts() {
  const snapshot = await getDocs(blogPostsCollection);
  const posts: BlogPost[] = [];
  snapshot.forEach(doc => {
    posts.push({ id: doc.id, ...doc.data() } as BlogPost);
  });
  return posts;
}

// Get a single blog post by slug
export async function getBlogPost(slug: string) {
  const q = query(blogPostsCollection, where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as BlogPost;
}


// Create a new blog post
export async function createBlogPost(post: Omit<BlogPost, 'id'>) {
  try {
    await addDoc(blogPostsCollection, post);
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
  } catch (error) {
    console.error("Error creating blog post:", error);
    throw new Error("Gagal membuat postingan blog.");
  }
}

// Update an existing blog post
export async function updateBlogPost(id: string, post: Partial<BlogPost>) {
  try {
    const postDoc = doc(db, 'blogPosts', id);
    await updateDoc(postDoc, post);
    revalidatePath('/admin/blog');
    revalidatePath(`/admin/blog/edit/${post.slug}`);
    revalidatePath('/blog');
    if (post.slug) {
        revalidatePath(`/blog/${post.slug}`);
    }
  } catch (error) {
    console.error("Error updating blog post:", error);
    throw new Error("Gagal memperbarui postingan blog.");
  }
}

// Delete a blog post
export async function deleteBlogPost(id: string) {
  try {
    const postDoc = doc(db, 'blogPosts', id);
    await deleteDoc(postDoc);
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
  } catch (error) {
    console.error("Error deleting blog post:", error);
    throw new Error("Gagal menghapus postingan blog.");
  }
}
