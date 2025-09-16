
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { notifyGoogleOfUpdate } from '@/services/indexing';
import type { BeritaPost } from '@/lib/definitions';
import { enhanceText } from '@/ai/flows/enhance-text-flow';

const beritaPostsCollection = collection(db, 'beritaPosts');
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gardalestari.org';

// Get all berita posts (articles and videos)
export async function getBeritaPosts(type?: 'artikel' | 'video' | 'draft') {
  let q;
  if (type) {
      q = query(beritaPostsCollection, where('type', '==', type), orderBy('date', 'desc'));
  } else {
      q = query(beritaPostsCollection, orderBy('date', 'desc'));
  }
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
    let finalSeoScore = post.seoScore || 0;
    // Only analyze SEO for published articles with content
    if (!finalSeoScore && post.content && post.status !== 'draft' && post.type === 'artikel') {
        try {
            const analysis = await enhanceText({ text: post.content });
            finalSeoScore = analysis.seoScore;
        } catch(e) { console.error("Auto SEO analysis failed on create", e); }
    }

    const postData: Omit<BeritaPost, 'id'> = {
      title: post.title || 'Judul Default',
      slug: post.slug || 'slug-default',
      content: post.content || '<p>Konten default.</p>',
      author: post.author || 'Admin',
      date: post.date || new Date().toISOString(),
      imageUrl: post.imageUrl || '',
      imageHint: post.imageHint || '',
      excerpt: post.excerpt || '',
      category: post.category || 'Umum',
      type: post.type || 'artikel',
      youtubeId: post.youtubeId || '',
      isFeatured: post.isFeatured || false,
      seoScore: finalSeoScore,
      status: post.status || 'published',
    };
    const docRef = await addDoc(beritaPostsCollection, { ...postData });
    
    // Only revalidate and notify if it's not a draft
    if (postData.status !== 'draft') {
        const pathToRevalidate = postData.type === 'video' ? '/video' : '/berita';
        revalidatePath('/panel/berita');
        revalidatePath(pathToRevalidate);
        revalidatePath('/');
        
        const publicUrl = `${BASE_URL}${pathToRevalidate}/${postData.slug}`;
        await notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
    }

    return { id: docRef.id, ...postData };

  } catch (error) {
    console.error("Error creating berita post:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal membuat konten: ${errorMessage}`);
  }
}

// Update an existing berita post
export async function updateBeritaPost(id: string, post: Partial<BeritaPost>) {
  try {
    const postDoc = doc(db, 'beritaPosts', id);
    await updateDoc(postDoc, post);
    
    const pathToRevalidate = post.type === 'video' ? '/video' : '/berita';
    revalidatePath('/panel/berita');
    revalidatePath(`/panel/berita/edit/${post.slug}`);
    revalidatePath(pathToRevalidate);
     if (post.slug) {
        revalidatePath(`${pathToRevalidate}/${post.slug}`);
    }
    revalidatePath('/');


    // Notify Google Indexing API
    if (post.slug && post.status !== 'draft') {
      const publicUrl = `${BASE_URL}${pathToRevalidate}/${post.slug}`;
      await notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
    }

  } catch (error) {
    console.error("Error updating berita post:", error);
    throw new Error("Gagal memperbarui konten.");
  }
}

// Delete a berita post
export async function deleteBeritaPost(id: string) {
  try {
    const postDocRef = doc(db, 'beritaPosts', id);
    const postToDelete = await getDoc(postDocRef);

    if (!postToDelete.exists()) {
        throw new Error("Konten tidak ditemukan.");
    }
    
    const postData = postToDelete.data() as BeritaPost;
    
    // Only notify google if it was a published post
    if (postData.status !== 'draft') {
        const pathToRevalidate = postData.type === 'video' ? '/video' : '/berita';
        const publicUrl = `${BASE_URL}${pathToRevalidate}/${postData.slug}`;
        await notifyGoogleOfUpdate(publicUrl, 'URL_DELETED');
    }
    
    await deleteDoc(postDocRef);
    revalidatePath('/panel/berita');
    revalidatePath('/berita');
    revalidatePath('/video');
    revalidatePath('/');

  } catch (error) {
    console.error("Error deleting berita post:", error);
    throw new Error("Gagal menghapus konten.");
  }
}

// Action to manually request re-indexing
export async function requestReindexing(slug: string, type: 'artikel' | 'video' = 'artikel') {
    try {
        const basePath = type === 'video' ? '/video' : '/berita';
        const publicUrl = `${BASE_URL}${basePath}/${slug}`;
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
