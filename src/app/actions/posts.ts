
'use server';

import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  runTransaction,
  Timestamp,
  addDoc,
  query,
  orderBy,
  increment,
  writeBatch,
  where,
  updateDoc,
  startAfter,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { Mention, MediaItem, Post, Author, PostWithAuthor, Comment, CommentWithAuthor } from '@/lib/definitions';

const postsCollection = collection(db, 'posts');
const usersCollection = collection(db, 'users'); 

// Helper to format date
const formatTimestamp = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
      return "Baru saja";
  }
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  } else {
    return `${diffDays} hari lalu`;
  }
};

// Helper function to build a PostWithAuthor object
const buildPostWithAuthor = async (postDoc: any, currentUserId?: string): Promise<PostWithAuthor | null> => {
    try {
        const postData = { id: postDoc.id, ...postDoc.data() } as Post;
        const authorRef = doc(usersCollection, postData.authorId);
        const authorDoc = await getDoc(authorRef);
        
        if (!authorDoc.exists()) {
            console.warn(`Author with ID ${postData.authorId} not found for post ${postData.id}. Skipping post.`);
            return null;
        }
        
        const authorData = authorDoc.data();

        const author: Author = {
            id: postData.authorId,
            name: authorData?.fullName || authorData?.displayName || 'Unknown User',
            username: authorData?.username || `user_${postData.authorId.substring(0,5)}`,
            avatarUrl: authorData?.avatarUrl || '',
            level: authorData?.level || 'Bronze',
            type: authorData?.type,
        };

        return {
          id: postData.id,
          author: author,
          media: postData.media || [{url: (postDoc.data() as any).imageUrl, type: 'image', hint: (postDoc.data() as any).imageHint, mentions: []}], // Fallback for old single-image posts
          caption: postData.caption,
          likesCount: postData.likes.length,
          commentsCount: postData.commentsCount,
          timestamp: formatTimestamp(postData.createdAt),
          isLiked: currentUserId ? postData.likes.includes(currentUserId) : false,
          status: postData.status || 'published',
        };
    } catch (error) {
        console.error(`Error building post ${postDoc.id}:`, error);
        return null; // Return null if any error occurs
    }
}


// Create a new post with multiple files
export async function createPost(formData: FormData) {
  const caption = formData.get('caption') as string;
  const authorId = formData.get('authorId') as string;
  const mediaPayloads = JSON.parse(formData.get('mediaPayloads') as string) as {mentions: Mention[]}[];
  const files = formData.getAll('files') as File[];

  if (!authorId) {
    throw new Error('Pengguna tidak terautentikasi.');
  }
  if (files.length === 0) {
    throw new Error('Setidaknya satu file harus diunggah.');
  }

  try {
    const mediaItems: MediaItem[] = [];
    const mentionedUserIds = new Set<string>();

    for (const [index, file] of files.entries()) {
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        const payload = mediaPayloads[index];
        const mentions = payload.mentions || [];
        mentions.forEach(m => mentionedUserIds.add(m.userId));

        mediaItems.push({
            url,
            type: file.type.startsWith('video') ? 'video' : 'image',
            hint: 'user uploaded content',
            mentions: mentions
        });
    }

    const newPost = {
      authorId,
      caption,
      media: mediaItems,
      likes: [],
      commentsCount: 0,
      createdAt: Timestamp.now(),
      status: 'published' as const,
      mentionedUserIds: Array.from(mentionedUserIds),
    };

    await addDoc(postsCollection, newPost);
    
    revalidatePath('/feed');
    revalidatePath('/profile/me');
  } catch (error) {
    console.error("[createPost Error]", error);
    throw new Error(`Gagal membuat postingan baru: ${(error as Error).message}`);
  }
}

// Get all posts with pagination
export async function getPosts(currentUserId: string, lastVisibleId?: string) {
  try {
    let q;
    if (lastVisibleId) {
        const lastVisibleDoc = await getDoc(doc(db, 'posts', lastVisibleId));
         q = query(
          postsCollection, 
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleDoc),
          limit(5)
        );
    } else {
         q = query(
          postsCollection, 
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
    }
   
    const postsSnapshot = await getDocs(q);
    
    const postPromises = postsSnapshot.docs.map(doc => 
      buildPostWithAuthor(doc as any, currentUserId)
    );

    const posts = (await Promise.all(postPromises)).filter((p): p is PostWithAuthor => p !== null);
    
    // Get the ID of the last document
    const lastDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
    const newLastVisibleId = lastDoc ? lastDoc.id : null;
    
    return {
      posts,
      lastVisibleId: newLastVisibleId
    };
  } catch (error) {
    console.error("Error getting posts:", error);
    throw new Error("Gagal memuat postingan.");
  }
}


// Get a single post by ID
export async function getPostById(postId: string, currentUserId?: string): Promise<PostWithAuthor | null> {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) { // Allow fetching archived posts by their ID
            return null;
        }

        const post = await buildPostWithAuthor(postDoc as any, currentUserId);
        return post;
    } catch (error) {
        console.error("Error getting post by ID:", error);
        throw new Error("Gagal mengambil detail postingan.");
    }
}


// Get all posts by a specific user ID for their profile
export async function getPostsByUserId(userId: string): Promise<PostWithAuthor[]> {
  try {
    const q = query(
      postsCollection, 
      where('authorId', '==', userId), 
      where('status', '==', 'published'), 
      orderBy('createdAt', 'desc')
    );
    const postsSnapshot = await getDocs(q);

    const postPromises = postsSnapshot.docs.map(doc => buildPostWithAuthor(doc as any));
    const posts = (await Promise.all(postPromises)).filter((p): p is PostWithAuthor => p !== null);
    return posts;
  } catch (error) {
    console.error("Error getting posts by user ID:", error);
    throw new Error("Gagal memuat postingan pengguna.");
  }
}


// Get archived posts for the current user
export async function getArchivedPosts(userId: string): Promise<PostWithAuthor[]> {
    try {
        const q = query(
            postsCollection,
            where('authorId', '==', userId),
            where('status', '==', 'archived'),
            orderBy('createdAt', 'desc')
        );
        const postsSnapshot = await getDocs(q);

        const postPromises = postsSnapshot.docs.map(doc => buildPostWithAuthor(doc as any, userId));
        const posts = (await Promise.all(postPromises)).filter((p): p is PostWithAuthor => p !== null);
        return posts;
    } catch (error) {
        console.error("Error getting archived posts:", error);
        throw new Error("Gagal memuat arsip.");
    }
}

// Get posts where a user is mentioned/tagged
export async function getTaggedPosts(userId: string): Promise<PostWithAuthor[]> {
    try {
        const q = query(
            postsCollection,
            where('mentionedUserIds', 'array-contains', userId),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc')
        );
        const postsSnapshot = await getDocs(q);
        
        const postPromises = postsSnapshot.docs.map(doc => buildPostWithAuthor(doc as any, userId));
        const posts = (await Promise.all(postPromises)).filter((p): p is PostWithAuthor => p !== null);
        return posts;
    } catch (error) {
        console.error("Error getting tagged posts:", error);
        throw new Error("Gagal memuat postingan yang ditandai.");
    }
}


// Toggle like on a post
export async function togglePostLike(postId: string, userId: string) {
  const postRef = doc(db, 'posts', postId);

  try {
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw "Postingan tidak ditemukan!";
      }

      const postData = postDoc.data();
      const likes = postData.likes || [];
      let newLikes;

      if (likes.includes(userId)) {
        // User has liked the post, so unlike it
        newLikes = likes.filter((uid: string) => uid !== userId);
      } else {
        // User has not liked the post, so like it
        newLikes = [...likes, userId];
      }

      transaction.update(postRef, { likes: newLikes });
    });
     revalidatePath('/feed');
     revalidatePath(`/p/${postId}`);
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error("Gagal memperbarui status suka.");
  }
}


export async function addComment(postId: string, userId: string, text: string) {
    try {
        if (!userId) throw new Error("Pengguna tidak terautentikasi.");
        if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

        const postRef = doc(db, 'posts', postId);
        const commentCollection = collection(postRef, 'comments');

        const batch = writeBatch(db);

        // Add new comment
        const newCommentRef = doc(commentCollection);
        batch.set(newCommentRef, {
            authorId: userId,
            text: text,
            createdAt: Timestamp.now()
        });

        // Increment commentsCount on the post
        batch.update(postRef, { commentsCount: increment(1) });
        
        await batch.commit();
        revalidatePath('/feed');
        revalidatePath(`/p/${postId}`);

    } catch (error) {
        console.error("Error adding comment: ", error);
        throw new Error("Gagal menambahkan komentar.");
    }
}


// Get comments for a post
export async function getComments(postId: string): Promise<CommentWithAuthor[]> {
    try {
        const postRef = doc(db, 'posts', postId);
        const commentsCollection = collection(postRef, 'comments');
        const q = query(commentsCollection, orderBy('createdAt', 'desc'));

        const commentsSnapshot = await getDocs(q);
        const comments: CommentWithAuthor[] = [];

        for (const commentDoc of commentsSnapshot.docs) {
            const commentData = { id: commentDoc.id, ...commentDoc.data() } as Comment;

            const authorDoc = await getDoc(doc(usersCollection, commentData.authorId));
            if (authorDoc.exists()) {
                const authorData = authorDoc.data();
                comments.push({
                    id: commentData.id,
                    author: {
                        name: authorData.fullName || 'User',
                        username: authorData.username || 'user',
                        avatarUrl: authorData.avatarUrl || ''
                    },
                    text: commentData.text,
                    timestamp: formatTimestamp(commentData.createdAt)
                });
            }
        }
        return comments;
    } catch (error) {
        console.error("Error getting comments:", error);
        throw new Error("Gagal memuat komentar.");
    }
}

// Archive a post
export async function archivePost(postId: string) {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { status: 'archived' });
        revalidatePath('/feed');
        revalidatePath('/profile/me');
    } catch (error) {
        console.error("Error archiving post:", error);
        throw new Error("Gagal mengarsipkan postingan.");
    }
}

// Unarchive a post
export async function unarchivePost(postId: string) {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { status: 'published' });
        revalidatePath('/feed');
        revalidatePath('/profile/me');
    } catch (error) {
        console.error("Error unarchiving post:", error);
        throw new Error("Gagal memulihkan postingan.");
    }
}
