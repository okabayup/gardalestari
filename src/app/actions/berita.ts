

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { notifyGoogleOfUpdate } from '@/services/indexing';
import type { BeritaPost, IndexingStatus } from '@/lib/definitions';
import { bulkGenerateNewsDrafts } from '@/ai/flows/bulk-generate-flow';
import { google } from 'googleapis';


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
        const newJobRef = doc(generationJobsCollection);
        await setDoc(newJobRef, {
            status: 'pending',
            totalCount,
            completedCount: 0,
            errors: [],
            createdAt: Timestamp.now(),
        });
        return newJobRef.id;
    } catch (error) {
        console.error("[createGenerationJob Error]", error);
        throw new Error(`Gagal membuat job baru di Firestore: ${(error as Error).message}`);
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
export async function getBeritaPosts(type?: 'artikel' | 'video', includeDrafts = false): Promise<BeritaPost[]> {
  try {
    let q;
    const constraints = [];
    if (type) {
        constraints.push(where('type', '==', type));
    }
    if (!includeDrafts) {
        constraints.push(where('status', '==', 'published'));
    }
    constraints.push(orderBy('date', 'desc'));
    
    q = query(beritaPostsCollection, ...constraints);
    
    const snapshot = await getDocs(q);
    
    let posts: BeritaPost[] = [];
    for (const doc of snapshot.docs) {
      const postData = { id: doc.id, ...doc.data() } as BeritaPost;
      if (postData.status === 'published') {
        const url = `${BASE_URL}/${postData.type === 'video' ? 'video' : 'berita'}/${postData.slug}`;
        postData.indexingStatus = await getNotificationStatus(url);
      }
      posts.push(postData);
    }

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
      ...post,
      status: post.status || 'draft', // Default to draft
    };
    
    const docRef = await addDoc(beritaPostsCollection, { ...postData });
    
    revalidatePath('/panel/berita');
    revalidatePath('/');

    if (postData.status === 'published') {
        const pathSegment = postData.type === 'video' ? 'video' : 'berita';
        revalidatePath(`/${pathSegment}`);
        const publicUrl = `${BASE_URL}/${pathSegment}/${postData.slug}`;
        // Do not await, let it run in the background
        notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
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
    const oldPostSnap = await getDoc(postDoc);
    const oldStatus = oldPostSnap.data()?.status;

    await updateDoc(postDoc, post);
    
    const pathSegment = post.type === 'video' ? 'video' : 'berita';
    revalidatePath('/panel/berita');
    revalidatePath(`/panel/berita/edit/${post.slug}`);
    revalidatePath(`/${pathSegment}`);
     if (post.slug) {
        revalidatePath(`/${pathSegment}/${post.slug}`);
    }
    revalidatePath('/');


    // Notify Google Indexing API only if status changes to published or if a published post is updated
    if (post.slug && (post.status === 'published' || oldStatus === 'published')) {
      const publicUrl = `${BASE_URL}/${pathSegment}/${post.slug}`;
      notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
    }

  } catch (error) {
    console.error("[updateBeritaPost Error]", error);
    throw new Error("Gagal memperbarui konten.");
  }
}

export async function updateBeritaStatusBulk(ids: string[], status: 'published' | 'draft') {
    if (ids.length === 0) return;
    try {
        const batch = writeBatch(db);
        const postsToUpdate = await Promise.all(ids.map(id => getDoc(doc(beritaPostsCollection, id))));

        for (const postDoc of postsToUpdate) {
            if (postDoc.exists()) {
                const postData = postDoc.data() as BeritaPost;
                batch.update(postDoc.ref, { status: status });

                if (status === 'published' && postData.status !== 'published') {
                    const pathSegment = postData.type === 'video' ? 'video' : 'berita';
                    const publicUrl = `${BASE_URL}/${pathSegment}/${postData.slug}`;
                    notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
                }
            }
        }
        
        await batch.commit();

        revalidatePath('/panel/berita');
        revalidatePath('/berita');
        revalidatePath('/video');
        revalidatePath('/');
    } catch (error) {
        console.error("[updateBeritaStatusBulk Error]", error);
        throw new Error("Gagal memperbarui status konten secara massal.");
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
    if (postData.status === 'published') {
        const pathSegment = postData.type === 'video' ? 'video' : 'berita';
        const publicUrl = `${BASE_URL}/${pathSegment}/${postData.slug}`;
        notifyGoogleOfUpdate(publicUrl, 'URL_DELETED');
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
        const basePath = type === 'video' ? '/video' : 'berita';
        const publicUrl = `${BASE_URL}/${basePath}/${slug}`;
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

async function getGoogleAuth() {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Cloud service account credentials are not set in environment variables.');
    }
    return new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/indexing']
    );
}

export async function getNotificationStatus(url: string): Promise<IndexingStatus | null> {
    try {
        const auth = await getGoogleAuth();
        const indexer = google.indexing({ version: 'v3', auth });

        const encodedUrl = encodeURIComponent(url);
        const response = await indexer.urlNotifications.getMetadata({
            url: encodedUrl,
        });

        if (response.status === 200 && response.data) {
            return {
                latestUpdate: response.data.latestUpdate,
                latestRemove: response.data.latestRemove,
            };
        }
        return null;
    } catch (error: any) {
        console.error('Error fetching notification status:', error.response?.data || error.message);
        return null;
    }
}
