'use server';

import { revalidatePath } from 'next/cache';
import { notifyGoogleOfUpdate } from '@/services/indexing';
import type { BeritaPost, IndexingStatus } from '@/lib/definitions';
import { bulkGenerateNewsDrafts } from '@/ai/flows/bulk-generate-flow';
import { google } from 'googleapis';
import { getAll, getOne, getFirst, create, update, remove, now } from '@/lib/db';

const COL_POSTS = 'beritaPosts';
const COL_JOBS = 'generationJobs';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// --- Job Tracking ---

export interface GenerationJob {
  id?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  totalCount: number;
  completedCount: number;
  errors: { topic: string; error: string }[];
  createdAt: string;
  completedAt?: string;
}

export async function createGenerationJob(totalCount: number): Promise<string> {
  try {
    const id = await create(COL_JOBS, {
      status: 'pending',
      totalCount,
      completedCount: 0,
      errors: [],
      createdAt: now(),
    });
    return id;
  } catch (error) {
    console.error("[createGenerationJob Error]", error);
    throw new Error(`Gagal membuat job baru: ${(error as Error).message}`);
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
  try {
    // Sequential read-modify-write (replaces Firebase transaction)
    const currentJob = await getOne<any>(COL_JOBS, jobId);
    if (!currentJob) throw new Error('Job not found');

    const newCompletedCount = (currentJob.completedCount || 0) + completedIncrement;
    const newErrors = error ? [...(currentJob.errors || []), error] : (currentJob.errors || []);
    const isComplete = newCompletedCount >= currentJob.totalCount;

    let finalStatus: GenerationJob['status'] = 'in-progress';
    let completedAt: string | undefined;

    if (isComplete) {
      finalStatus = newErrors.length === currentJob.totalCount ? 'failed' : 'completed';
      completedAt = now();
    }

    await update(COL_JOBS, jobId, {
      completedCount: newCompletedCount,
      status: finalStatus,
      errors: newErrors,
      ...(completedAt ? { completedAt } : {}),
    });
  } catch (e) {
    console.error("[updateJobProgress Error]", `Failed to update job ${jobId}`, e);
    throw new Error(`Gagal memperbarui progres job: ${(e as Error).message}`);
  }
}

export async function getJobStatus(jobId: string): Promise<GenerationJob | null> {
  try {
    const row = await getOne<any>(COL_JOBS, jobId);
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      totalCount: row.totalCount,
      completedCount: row.completedCount,
      errors: row.errors || [],
      createdAt: row.createdAt || new Date().toISOString(),
      completedAt: row.completedAt,
    };
  } catch (error) {
    console.error(`[getJobStatus Error]`, error);
    throw new Error(`Gagal mengambil data pekerjaan: ${(error as Error).message}`);
  }
}

export async function getGenerationJobs(): Promise<GenerationJob[]> {
  try {
    const rows = await getAll<any>(COL_JOBS, { orderBy: { field: 'createdAt', direction: 'desc' } });
    return rows.map(row => ({
      id: row.id,
      status: row.status,
      totalCount: row.totalCount,
      completedCount: row.completedCount,
      errors: row.errors || [],
      createdAt: row.createdAt || new Date().toISOString(),
      completedAt: row.completedAt,
    }));
  } catch (error) {
    console.error("[getGenerationJobs Error]", error);
    throw new Error("Gagal mengambil daftar pekerjaan generasi.");
  }
}

// --- Content Management ---

export async function getBeritaPosts(type?: 'artikel' | 'video', includeDrafts = false): Promise<BeritaPost[]> {
  try {
    const where: any[] = [];
    if (type) where.push({ field: 'type', op: '==', value: type });
    if (!includeDrafts) where.push({ field: 'status', op: '==', value: 'published' });

    const rows = await getAll<any>(COL_POSTS, {
      where: where.length === 1 ? where[0] : where.length > 1 ? where : undefined,
      orderBy: { field: 'date', direction: 'desc' },
    });

    return rows.map(row => ({
      ...row,
      date: row.date || new Date().toISOString(),
    })) as BeritaPost[];
  } catch (error) {
    console.error("[getBeritaPosts Error]", error);
    throw new Error("Gagal mengambil data konten.");
  }
}

export async function getBeritaPost(slug: string) {
  if (!slug) return null;
  try {
    const row = await getFirst<any>(COL_POSTS, {
      where: { field: 'slug', op: '==', value: slug },
    });
    if (!row) return null;
    return { ...row, date: row.date || new Date().toISOString() } as BeritaPost;
  } catch (error) {
    console.error(`[getBeritaPost Error] slug=${slug}:`, error);
    throw new Error("Gagal mengambil detail konten.");
  }
}

export async function createBeritaPost(post: Omit<BeritaPost, 'id'>) {
  try {
    const postData: Omit<BeritaPost, 'id'> = {
      ...post,
      status: post.status || 'draft',
    };

    const docId = await create(COL_POSTS, postData as Record<string, unknown>);

    revalidatePath('/panel/berita');
    revalidatePath('/');

    if (postData.status === 'published' && postData.slug) {
      const pathSegment = postData.type === 'video' ? 'video' : 'berita';
      revalidatePath(`/${pathSegment}`);
      const publicUrl = `${BASE_URL}/${pathSegment}/${postData.slug}`;
      notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
    }

    return { id: docId, ...postData };
  } catch (error) {
    console.error("[createBeritaPost Error]", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal membuat konten: ${errorMessage}`);
  }
}

export async function updateBeritaPost(id: string, post: Partial<BeritaPost>) {
  try {
    const oldPost = await getOne<any>(COL_POSTS, id);
    if (!oldPost) throw new Error("Konten tidak ditemukan.");

    await update(COL_POSTS, id, post as Record<string, unknown>);

    const currentType = post.type || oldPost.type;
    const currentSlug = post.slug || oldPost.slug;
    const currentStatus = post.status || oldPost.status;
    const pathSegment = currentType === 'video' ? 'video' : 'berita';

    revalidatePath('/panel/berita');
    if (currentSlug) {
      revalidatePath(`/panel/berita/edit/${currentSlug}`);
      revalidatePath(`/${pathSegment}/${currentSlug}`);
    }
    revalidatePath(`/${pathSegment}`);
    revalidatePath('/');

    if (currentSlug && currentStatus === 'published') {
      const publicUrl = `${BASE_URL}/${pathSegment}/${currentSlug}`;
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
    // Parallel updates (replaces writeBatch)
    const posts = await Promise.all(ids.map(id => getOne<any>(COL_POSTS, id)));

    await Promise.all(
      posts
        .filter(Boolean)
        .map(async (postData) => {
          if (!postData) return;
          await update(COL_POSTS, postData.id, { status });

          if (status === 'published' && postData.status !== 'published' && postData.slug) {
            const pathSegment = postData.type === 'video' ? 'video' : 'berita';
            const publicUrl = `${BASE_URL}/${pathSegment}/${postData.slug}`;
            notifyGoogleOfUpdate(publicUrl, 'URL_UPDATED');
          }
        })
    );

    revalidatePath('/panel/berita');
    revalidatePath('/berita');
    revalidatePath('/video');
    revalidatePath('/');
  } catch (error) {
    console.error("[updateBeritaStatusBulk Error]", error);
    throw new Error("Gagal memperbarui status konten secara massal.");
  }
}

export async function deleteBeritaPost(id: string) {
  try {
    const postData = await getOne<any>(COL_POSTS, id);
    if (!postData) throw new Error("Konten tidak ditemukan.");

    if (postData.status === 'published' && postData.slug) {
      const pathSegment = postData.type === 'video' ? 'video' : 'berita';
      const publicUrl = `${BASE_URL}/${pathSegment}/${postData.slug}`;
      notifyGoogleOfUpdate(publicUrl, 'URL_DELETED');
    }

    await remove(COL_POSTS, id);
    revalidatePath('/panel/berita');
    revalidatePath('/berita');
    revalidatePath('/video');
    revalidatePath('/');
  } catch (error) {
    console.error("[deleteBeritaPost Error]", error);
    throw new Error("Gagal menghapus konten.");
  }
}

export async function requestReindexing(slug: string, type: 'artikel' | 'video' = 'artikel') {
  try {
    const basePath = type === 'video' ? 'video' : 'berita';
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
    ['https://www.googleapis.com/auth/indexing', 'https://www.googleapis.com/auth/webmasters.readonly']
  );
}

export async function getNotificationStatus(slug: string): Promise<IndexingStatus | null> {
  try {
    const post = await getBeritaPost(slug);
    if (!post) return null;

    const pathSegment = post.type === 'video' ? 'video' : 'berita';
    const url = `${BASE_URL}/${pathSegment}/${post.slug}`;

    const auth = await getGoogleAuth();
    const indexer = google.indexing({ version: 'v3', auth });
    const response = await indexer.urlNotifications.getMetadata({ url });

    if (response.status === 200 && response.data) {
      return {
        latestUpdate: response.data.latestUpdate ? {
          type: String(response.data.latestUpdate.type || ''),
          notifyTime: String(response.data.latestUpdate.notifyTime || ''),
        } : undefined,
        latestRemove: response.data.latestRemove ? {
          type: String(response.data.latestRemove.type || ''),
          notifyTime: String(response.data.latestRemove.notifyTime || ''),
        } : undefined,
      };
    }
    return null;
  } catch (error: any) {
    if (error.code === 404) return null;
    console.error('Error fetching notification status:', error.response?.data || error.message || error);
    return null;
  }
}
