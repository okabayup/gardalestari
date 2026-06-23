'use server';

import { revalidatePath } from 'next/cache';
import type { Mention, MediaItem, Post, Author, PostWithAuthor, Comment, CommentWithAuthor } from '@/lib/definitions';
import { getAll, getOne, create, update, remove, uploadFile, now } from '@/lib/db';
import { checkAndAwardBadges } from '@/app/actions/badges';

const COL_POSTS = 'posts';
const COL_USERS = 'users';
// Comments stored as flat table with postId field (replaces subcollection posts/{id}/comments)
const COL_POST_COMMENTS = 'postComments';

// Helper: format ISO string date as relative time
const formatTimestamp = (dateStr: string | any): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) :
    dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Baru saja";
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
};

// Helper: build PostWithAuthor from post row + optional current user
const buildPostWithAuthor = async (postData: any, currentUserId?: string): Promise<PostWithAuthor | null> => {
  try {
    const authorData = await getOne<any>(COL_USERS, postData.authorId);

    if (!authorData) {
      console.warn(`Author with ID ${postData.authorId} not found for post ${postData.id}. Skipping.`);
      return null;
    }

    const author: Author = {
      id: postData.authorId,
      name: authorData.fullName || authorData.displayName || 'Unknown User',
      username: authorData.username || `user_${postData.authorId.substring(0, 5)}`,
      avatarUrl: authorData.avatarUrl || '',
      level: authorData.level || 'Bronze',
      type: authorData.type,
    };

    return {
      id: postData.id,
      author,
      media: postData.media || [{ url: postData.imageUrl, type: 'image', hint: postData.imageHint, mentions: [] }],
      caption: postData.caption,
      likesCount: (postData.likes || []).length,
      commentsCount: postData.commentsCount,
      timestamp: formatTimestamp(postData.createdAt),
      isLiked: currentUserId ? (postData.likes || []).includes(currentUserId) : false,
      status: postData.status || 'published',
    };
  } catch (error) {
    console.error(`Error building post ${postData.id}:`, error);
    return null;
  }
};

export async function createPost(formData: FormData) {
  const caption = formData.get('caption') as string;
  const authorId = formData.get('authorId') as string;
  const mediaPayloads = JSON.parse(formData.get('mediaPayloads') as string) as { mentions: Mention[] }[];
  const files = formData.getAll('files') as File[];

  if (!authorId) throw new Error('Pengguna tidak terautentikasi.');
  if (files.length === 0) throw new Error('Setidaknya satu file harus diunggah.');

  try {
    const mediaItems: MediaItem[] = [];
    const mentionedUserIds = new Set<string>();

    for (const [index, file] of files.entries()) {
      const url = await uploadFile(file, `posts/${Date.now()}_${file.name}`);
      const payload = mediaPayloads[index];
      const mentions = payload.mentions || [];
      mentions.forEach(m => mentionedUserIds.add(m.userId));

      mediaItems.push({
        url,
        type: file.type.startsWith('video') ? 'video' : 'image',
        hint: 'user uploaded content',
        mentions,
      });
    }

    const newPost = {
      authorId,
      caption,
      media: mediaItems,
      likes: [],
      commentsCount: 0,
      createdAt: now(),
      status: 'published' as const,
      mentionedUserIds: Array.from(mentionedUserIds),
    };

    await create(COL_POSTS, newPost);
    await checkAndAwardBadges(authorId, 'post_count');

    revalidatePath('/feed');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error("[createPost Error]", error);
    throw new Error(`Gagal membuat postingan baru: ${(error as Error).message}`);
  }
}

export async function getPosts(currentUserId: string, lastVisibleId?: string) {
  try {
    let offset = 0;

    if (lastVisibleId) {
      // Count posts before lastVisibleId to determine offset (cursor simulation)
      const allPosts = await getAll<any>(COL_POSTS, {
        where: { field: 'status', op: '==', value: 'published' },
        orderBy: { field: 'createdAt', direction: 'desc' },
      });
      const idx = allPosts.findIndex(p => p.id === lastVisibleId);
      offset = idx >= 0 ? idx + 1 : 0;
    }

    // Fetch published posts sorted by createdAt desc
    const allPosts = await getAll<any>(COL_POSTS, {
      where: { field: 'status', op: '==', value: 'published' },
      orderBy: { field: 'createdAt', direction: 'desc' },
    });

    const pagePosts = allPosts.slice(offset, offset + 5);
    const postPromises = pagePosts.map(p => buildPostWithAuthor(p, currentUserId));
    const posts = (await Promise.all(postPromises)).filter((p): p is PostWithAuthor => p !== null);

    const lastDoc = pagePosts[pagePosts.length - 1];
    const newLastVisibleId = lastDoc ? lastDoc.id : null;

    return { posts, lastVisibleId: newLastVisibleId };
  } catch (error) {
    console.error("Error getting posts:", error);
    throw new Error("Gagal memuat postingan.");
  }
}

export async function getPostById(postId: string, currentUserId?: string): Promise<PostWithAuthor | null> {
  try {
    const postData = await getOne<any>(COL_POSTS, postId);
    if (!postData || postData.status !== 'published') return null;
    return buildPostWithAuthor(postData, currentUserId);
  } catch (error) {
    console.error("Error getting post by ID:", error);
    throw new Error("Gagal mengambil detail postingan.");
  }
}

export async function getPostsByUserId(userId: string): Promise<PostWithAuthor[]> {
  try {
    const posts = await getAll<any>(COL_POSTS, {
      where: [
        { field: 'authorId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'published' },
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
    const results = (await Promise.all(posts.map(p => buildPostWithAuthor(p)))).filter((p): p is PostWithAuthor => p !== null);
    return results;
  } catch (error) {
    console.error("Error getting posts by user ID:", error);
    throw new Error("Gagal memuat postingan pengguna.");
  }
}

export async function getArchivedPosts(userId: string): Promise<PostWithAuthor[]> {
  try {
    const posts = await getAll<any>(COL_POSTS, {
      where: [
        { field: 'authorId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'archived' },
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
    const results = (await Promise.all(posts.map(p => buildPostWithAuthor(p, userId)))).filter((p): p is PostWithAuthor => p !== null);
    return results;
  } catch (error) {
    console.error("Error getting archived posts:", error);
    throw new Error("Gagal memuat arsip.");
  }
}

export async function getTaggedPosts(userId: string): Promise<PostWithAuthor[]> {
  try {
    const posts = await getAll<any>(COL_POSTS, {
      where: [
        { field: 'mentionedUserIds', op: 'array-contains', value: userId },
        { field: 'status', op: '==', value: 'published' },
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
    const results = (await Promise.all(posts.map(p => buildPostWithAuthor(p, userId)))).filter((p): p is PostWithAuthor => p !== null);
    return results;
  } catch (error) {
    console.error("Error getting tagged posts:", error);
    throw new Error("Gagal memuat postingan yang ditandai.");
  }
}

export async function togglePostLike(postId: string, userId: string) {
  try {
    // Sequential read-modify-write (replaces Firebase transaction)
    const postData = await getOne<any>(COL_POSTS, postId);
    if (!postData) throw new Error("Postingan tidak ditemukan!");

    const likes: string[] = postData.likes || [];
    const newLikes = likes.includes(userId)
      ? likes.filter(uid => uid !== userId)
      : [...likes, userId];

    await update(COL_POSTS, postId, { likes: newLikes });
    revalidatePath('/feed');
    revalidatePath(`/p/${postId}`);
  } catch (e) {
    console.error("Error toggling like:", e);
    throw new Error("Gagal memperbarui status suka.");
  }
}

export async function addComment(postId: string, userId: string, text: string) {
  try {
    if (!userId) throw new Error("Pengguna tidak terautentikasi.");
    if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

    // Create comment in flat table (replaces subcollection)
    await create(COL_POST_COMMENTS, {
      postId,
      authorId: userId,
      text,
      createdAt: now(),
    });

    // Increment commentsCount on the post
    const postData = await getOne<any>(COL_POSTS, postId);
    if (postData) {
      await update(COL_POSTS, postId, { commentsCount: (postData.commentsCount || 0) + 1 });
    }

    revalidatePath('/feed');
    revalidatePath(`/p/${postId}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error("Gagal menambahkan komentar.");
  }
}

export async function getComments(postId: string): Promise<CommentWithAuthor[]> {
  try {
    const comments = await getAll<any>(COL_POST_COMMENTS, {
      where: { field: 'postId', op: '==', value: postId },
      orderBy: { field: 'createdAt', direction: 'desc' },
    });

    const results: CommentWithAuthor[] = [];
    for (const comment of comments) {
      const authorData = await getOne<any>(COL_USERS, comment.authorId);
      if (authorData) {
        results.push({
          id: comment.id,
          author: {
            name: authorData.fullName || 'User',
            username: authorData.username || 'user',
            avatarUrl: authorData.avatarUrl || '',
          },
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
        });
      }
    }
    return results;
  } catch (error) {
    console.error("Error getting comments:", error);
    throw new Error("Gagal memuat komentar.");
  }
}

export async function archivePost(postId: string) {
  try {
    await update(COL_POSTS, postId, { status: 'archived' });
    revalidatePath('/feed');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error("Error archiving post:", error);
    throw new Error("Gagal mengarsipkan postingan.");
  }
}

export async function unarchivePost(postId: string) {
  try {
    await update(COL_POSTS, postId, { status: 'published' });
    revalidatePath('/feed');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error("Error unarchiving post:", error);
    throw new Error("Gagal memulihkan postingan.");
  }
}

export async function updatePostStatus(postId: string, status: 'published' | 'hidden_by_moderator' | 'archived'): Promise<void> {
  if (!postId) throw new Error('ID Postingan dibutuhkan.');

  const postData = await getOne<any>(COL_POSTS, postId);
  if (!postData) throw new Error('Postingan tidak ditemukan.');

  await update(COL_POSTS, postId, { status });

  revalidatePath('/feed');
  revalidatePath('/panel/reports');
}
