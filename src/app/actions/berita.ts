
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { notifyGoogleOfUpdate } from '@/services/indexing';
import type { BeritaPost } from '@/lib/definitions';
import { enhanceText } from '@/ai/flows/enhance-text-flow';

const beritaPostsCollection = collection(db, 'beritaPosts');
const generationJobsCollection = collection(db, 'generationJobs');
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gardalestari.org';

// --- Job Tracking for Agentic Features ---
export interface GenerationJob {
    id?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    totalCount: number;
    completedCount: number;
    errors: { topic: string; error: string }[];
    createdAt: string; // ISO string
    completedAt?: string; // ISO string
}

export async function createGenerationJob(totalCount: number): Promise<string> {
    const newJob = {
        status: 'pending' as const,
        totalCount,
        completedCount: 0,
        errors: [],
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(generationJobsCollection, newJob);
    return docRef.id;
}

export async function updateJobProgress(jobId: string, completedIncrement: number, error?: { topic: string; error: string }) {
    const jobRef = doc(db, 'generationJobs', jobId);
    
    // This part can remain since it only writes to the DB, not reads and sends to client.
    // However, to be safe and consistent, we'll use a transaction with get.
    await db.runTransaction(async (transaction) => {
        const jobDoc = await transaction.get(jobRef);
        if (!jobDoc.exists()) throw new Error('Job not found');

        const currentJob = jobDoc.data();
        const newCompletedCount = (currentJob.completedCount || 0) + completedIncrement;
        const newErrors = error ? [...(currentJob.errors || []), error] : (currentJob.errors || []);

        const isComplete = newCompletedCount >= currentJob.totalCount;

        transaction.update(jobRef, {
            completedCount: newCompletedCount,
            status: isComplete ? 'completed' : 'in-progress',
            errors: newErrors,
            ...(isComplete && { completedAt: serverTimestamp() }),
        });
    });
}


export async function getJobStatus(jobId: string): Promise<GenerationJob | null> {
    const docRef = doc(db, 'generationJobs', jobId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            status: data.status,
            totalCount: data.totalCount,
            completedCount: data.completedCount,
            errors: data.errors,
            // Convert Timestamps to ISO strings before returning to the client
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            completedAt: (data.completedAt as Timestamp)?.toDate().toISOString(),
        } as GenerationJob;
    }
    return null;
}


// --- Content Management ---

// Get all berita posts (articles and videos)
export async function getBeritaPosts(type?: 'artikel' | 'video') {
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
      seoScore: post.seoScore || 0,
      status: post.status || 'published',
    };
    
    // For drafts, we can use setDoc with a specific ID if we want, or just addDoc.
    // Let's use addDoc for simplicity.
    const docRef = await addDoc(beritaPostsCollection, { ...postData });
    
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
