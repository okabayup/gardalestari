

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, setDoc, runTransaction } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { notifyGoogleOfUpdate } from '@/services/indexing';
import type { BeritaPost } from '@/lib/definitions';
import { bulkGenerateNewsDrafts } from '@/ai/flows/bulk-generate-flow';
import { logAnalyticsEvent } from '@/lib/analytics';

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
    try {
        const newJobRef = doc(collection(db, 'generationJobs'));
        await setDoc(newJobRef, {
            status: 'pending',
            totalCount,
            completedCount: 0,
            errors: [],
            createdAt: Timestamp.now(),
        });
        logAnalyticsEvent('create_bulk_job', { topic_count: totalCount });
        return newJobRef.id;
    } catch (error) {
        console.error("[createGenerationJob Error]", error);
        throw new Error("Gagal membuat job baru di Firestore.");
    }
}

export async function retryFailedTopics(job: GenerationJob): Promise<string> {
    try {
        if (!job.errors || job.errors.length === 0) {
            throw new Error("Tidak ada topik yang gagal untuk dicoba lagi.");
        }
        const topicsToRetry = job.errors.map(err => ({ title: err.topic, description: 'Mencoba ulang dari kegagalan sebelumnya.' }));

        const newJobId = await createGenerationJob(topicsToRetry.length);
        
        // Run in background, don't await
        bulkGenerateNewsDrafts({ topics: topicsToRetry, jobId: newJobId });
        
        revalidatePath('/panel/berita/jobs');
        return newJobId;
    } catch (error) {
        console.error("[retryFailedTopics Error]", error);
        throw new Error("Gagal memulai ulang topik yang gagal.");
    }
}


export async function updateJobProgress(jobId: string, completedIncrement: number, error?: { topic: string; error: string }) {
    const jobRef = doc(db, 'generationJobs', jobId);
    
    try {
      await runTransaction(db, async (transaction) => {
          const jobDoc = await transaction.get(jobRef);
          if (!jobDoc.exists()) throw new Error('Job not found');

          const currentJob = jobDoc.data();
          const newCompletedCount = (currentJob.completedCount || 0) + completedIncrement;
          const newErrors = error ? [...(currentJob.errors || []), error] : (currentJob.errors || []);

          const isComplete = newCompletedCount >= currentJob.totalCount;
          let finalStatus: GenerationJob['status'] = 'in-progress';
          let completedAtField: { completedAt?: Timestamp } = {};


          if (isComplete) {
              finalStatus = newErrors.length === currentJob.totalCount ? 'failed' : 'completed';
              completedAtField.completedAt = Timestamp.now();
          }

          transaction.update(jobRef, {
              completedCount: newCompletedCount,
              status: finalStatus,
              errors: newErrors,
              ...completedAtField
          });
      });
    } catch (e) {
      console.error("[updateJobProgress Error]", `Failed to update job ${jobId}`, e);
      throw new Error(`Gagal memperbarui progres job: ${(e as Error).message}`);
    }
}


export async function getJobStatus(jobId: string): Promise<GenerationJob | null> {
    try {
        const docRef = doc(db, 'generationJobs', jobId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Safe conversion of Timestamps to ISO strings
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            const completedAt = data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : undefined;

            return {
                id: docSnap.id,
                status: data.status,
                totalCount: data.totalCount,
                completedCount: data.completedCount,
                errors: data.errors || [],
                createdAt,
                completedAt,
            } as GenerationJob;
        }
        return null;
    } catch (error) {
        console.error(`[getJobStatus Error] Failed to get job ${jobId}:`, error);
        throw new Error(`Gagal mengambil data pekerjaan: ${(error as Error).message}`);
    }
}

export async function getGenerationJobs(): Promise<GenerationJob[]> {
    try {
        const q = query(generationJobsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Safe conversion for all entries
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            const completedAt = data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : undefined;

            return {
                id: doc.id,
                status: data.status,
                totalCount: data.totalCount,
                completedCount: data.completedCount,
                errors: data.errors || [],
                createdAt,
                completedAt,
            } as GenerationJob;
        });
    } catch (error) {
        console.error("[getGenerationJobs Error]", error);
        throw new Error("Gagal mengambil daftar pekerjaan generasi.");
    }
}


// --- Content Management ---

// Get all berita posts (articles and videos)
export async function getBeritaPosts(type?: 'artikel' | 'video') {
  try {
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
  } catch (error) {
    console.error("[getBeritaPosts Error]", error);
    throw new Error("Gagal mengambil data konten.");
  }
}

// Get a single berita post by slug
export async function getBeritaPost(slug: string) {
  try {
    const q = query(beritaPostsCollection, where("slug", "==", slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as BeritaPost;
  } catch (error) {
    console.error(`[getBeritaPost Error] Failed to get post with slug ${slug}:`, error);
    throw new Error("Gagal mengambil detail konten.");
  }
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
    console.error("[createBeritaPost Error]", error);
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
    console.error("[updateBeritaPost Error]", error);
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
    console.error("[deleteBeritaPost Error]", error);
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
        console.error("[requestReindexing Error]", error);
        throw new Error("Gagal meminta indeksasi ulang.");
    }
}

