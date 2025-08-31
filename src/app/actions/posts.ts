
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
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { MemberType } from './members';

type MediaType = 'image' | 'video';

export interface Mention {
    userId: string;
    username: string; // denormalized for easy display
    x: number; // position percentage
    y: number; // position percentage
}

export interface MediaItem {
    url: string;
    type: MediaType;
    hint: string;
    mentions?: Mention[];
}

interface Post {
  id: string;
  authorId: string;
  media: MediaItem[];
  caption: string;
  likes: string[]; // Array of user UIDs who liked the post
  commentsCount: number;
  createdAt: Timestamp;
  status: 'published' | 'archived';
  mentionedUserIds: string[]; // For querying posts where a user is mentioned
}

interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  type?: MemberType;
}

export interface PostWithAuthor {
  id: string;
  author: Author;
  media: MediaItem[];
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  isLiked: boolean;
}

export interface Comment {
    id: string;
    authorId: string;
    text: string;
    createdAt: Timestamp;
}

export interface CommentWithAuthor {
    id: string;
    author: {
        name: string;
        username: string;
        avatarUrl: string;
    };
    text: string;
    timestamp: string;
}


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
const buildPostWithAuthor = async (postData: Post, currentUserId?: string): Promise<PostWithAuthor> => {
    const authorRef = doc(usersCollection, postData.authorId);
    const authorDoc = await getDoc(authorRef);
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
      media: postData.media || [{url: (postData as any).imageUrl, type: 'image', hint: (postData as any).imageHint, mentions: []}], // Fallback for old single-image posts
      caption: postData.caption,
      likesCount: postData.likes.length,
      commentsCount: postData.commentsCount,
      timestamp: formatTimestamp(postData.createdAt),
      isLiked: currentUserId ? postData.likes.includes(currentUserId) : false,
    };
}


// Create a new post with multiple files
export async function createPost(caption: string, mediaPayload: {file: File, mentions: Mention[]}[], authorId: string) {
  if (!authorId) {
    throw new Error('Pengguna tidak terautentikasi.');
  }
  if (mediaPayload.length === 0) {
    throw new Error('Setidaknya satu file harus diunggah.');
  }

  try {
    const mediaItems: MediaItem[] = [];
    const mentionedUserIds = new Set<string>();

    // Upload all files to Firebase Storage in parallel
    await Promise.all(mediaPayload.map(async (payload) => {
        const file = payload.file;
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        const mentions = payload.mentions || [];
        mentions.forEach(m => mentionedUserIds.add(m.userId));

        mediaItems.push({
            url,
            type: file.type.startsWith('video') ? 'video' : 'image',
            hint: 'user uploaded content',
            mentions: mentions
        });
    }));

    // Create post document in Firestore
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
    console.error("Error creating post:", error);
    throw new Error("Gagal membuat postingan baru.");
  }
}

// Get all posts
export async function getPosts(currentUserId: string): Promise<PostWithAuthor[]> {
  const q = query(
    postsCollection, 
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  );
  const postsSnapshot = await getDocs(q);
  
  const posts = await Promise.all(postsSnapshot.docs.map(doc => 
    buildPostWithAuthor({ id: doc.id, ...doc.data() } as Post, currentUserId)
  ));
  
  return posts;
}

// Get all posts by a specific user ID for their profile
export async function getPostsByUserId(userId: string): Promise<PostWithAuthor[]> {
  const q = query(
    postsCollection, 
    where('authorId', '==', userId), 
    where('status', '==', 'published'), 
    orderBy('createdAt', 'desc')
  );
  const postsSnapshot = await getDocs(q);

  const posts = await Promise.all(postsSnapshot.docs.map(doc => 
    buildPostWithAuthor({ id: doc.id, ...doc.data() } as Post)
  ));
  return posts;
}


// Get archived posts for the current user
export async function getArchivedPosts(userId: string): Promise<PostWithAuthor[]> {
    const q = query(
        postsCollection,
        where('authorId', '==', userId),
        where('status', '==', 'archived'),
        orderBy('createdAt', 'desc')
    );
    const postsSnapshot = await getDocs(q);

    const posts = await Promise.all(postsSnapshot.docs.map(doc =>
        buildPostWithAuthor({ id: doc.id, ...doc.data() } as Post, userId)
    ));
    return posts;
}

// Get posts where a user is mentioned/tagged
export async function getTaggedPosts(userId: string): Promise<PostWithAuthor[]> {
    const q = query(
        postsCollection,
        where('mentionedUserIds', 'array-contains', userId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
    );
    const postsSnapshot = await getDocs(q);
    
    const posts = await Promise.all(postsSnapshot.docs.map(doc =>
        buildPostWithAuthor({ id: doc.id, ...doc.data() } as Post, userId)
    ));
    return posts;
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
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error("Gagal memperbarui status suka.");
  }
}


export async function addComment(postId: string, userId: string, text: string) {
    if (!userId) throw new Error("Pengguna tidak terautentikasi.");
    if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

    const postRef = doc(db, 'posts', postId);
    const commentCollection = collection(postRef, 'comments');

    try {
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

    } catch (error) {
        console.error("Error adding comment: ", error);
        throw new Error("Gagal menambahkan komentar.");
    }
}


// Get comments for a post
export async function getComments(postId: string): Promise<CommentWithAuthor[]> {
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
}

// Archive a post
export async function archivePost(postId: string) {
    const postRef = doc(db, 'posts', postId);
    try {
        await updateDoc(postRef, { status: 'archived' });
        revalidatePath('/feed');
        revalidatePath('/profile/me');
    } catch (error) {
        console.error("Error archiving post:", error);
        throw new Error("Gagal mengarsipkan postingan.");
    }
}
