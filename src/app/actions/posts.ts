
'use server';

import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  writeBatch,
  runTransaction,
  Timestamp,
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';


interface Post {
  id: string;
  authorId: string;
  imageUrl: string;
  imageHint: string;
  caption: string;
  likes: string[]; // Array of user UIDs who liked the post
  commentsCount: number;
  createdAt: Timestamp;
}

interface Author {
  name: string;
  avatarUrl: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface PostWithAuthor {
  id: string;
  author: Author;
  imageUrl: string;
  imageHint: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  isLiked: boolean;
}

const postsCollection = collection(db, 'posts');
const usersCollection = collection(db, 'users'); // Assuming you have a users collection

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


// Create a new post
export async function createPost(caption: string, imageFile: File, authorId: string) {
  if (!authorId) {
    throw new Error('Pengguna tidak terautentikasi.');
  }
  
  try {
    // 1. Upload image to Firebase Storage
    const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // 2. Create post document in Firestore
    const newPost = {
      authorId,
      caption,
      imageUrl,
      imageHint: "user uploaded content", // Generic hint for user uploads
      likes: [],
      commentsCount: 0,
      createdAt: Timestamp.now(),
    };

    await addDoc(postsCollection, newPost);
    
    // 3. Revalidate path to show new post
    revalidatePath('/feed');

  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Gagal membuat postingan baru.");
  }
}

// Get all posts
export async function getPosts(currentUserId: string): Promise<PostWithAuthor[]> {
  const q = query(postsCollection, orderBy('createdAt', 'desc'));
  const postsSnapshot = await getDocs(q);
  const posts: PostWithAuthor[] = [];

  for (const postDoc of postsSnapshot.docs) {
    const postData = { id: postDoc.id, ...postDoc.data() } as Post;

    // Get author details
    const authorDoc = await getDoc(doc(usersCollection, postData.authorId));
    const authorData = authorDoc.data() as Author || { name: 'Unknown User', avatarUrl: '', level: 'Bronze' };

    posts.push({
      id: postData.id,
      author: authorData,
      imageUrl: postData.imageUrl,
      imageHint: postData.imageHint,
      caption: postData.caption,
      likesCount: postData.likes.length,
      commentsCount: postData.commentsCount,
      timestamp: formatTimestamp(postData.createdAt),
      isLiked: postData.likes.includes(currentUserId),
    });
  }

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
