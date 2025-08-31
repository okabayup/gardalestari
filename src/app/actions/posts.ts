
'use server';

import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore';

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

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  }
};


// This function is for seeding data if the collection is empty.
// In a real app, users would create posts.
async function seedPostsData() {
  const snapshot = await getDocs(postsCollection);
  if (snapshot.empty) {
    console.log("Posts collection is empty. Seeding data...");
    const batch = writeBatch(db);

    // Let's create some dummy users first
    const user1Ref = doc(usersCollection, 'user1_id');
    batch.set(user1Ref, { name: 'Rina Lestari', avatarUrl: 'https://picsum.photos/id/1011/50/50' });

    const user2Ref = doc(usersCollection, 'user2_id');
    batch.set(user2Ref, { name: 'Budi Santoso', avatarUrl: 'https://picsum.photos/id/1025/50/50' });
    
    const user3Ref = doc(usersCollection, 'user3_id');
    batch.set(user3Ref, { name: 'Citra Dewi', avatarUrl: 'https://picsum.photos/id/1027/50/50' });

    // Now, create posts
    const postsToSeed = [
      {
        authorId: 'user1_id',
        imageUrl: 'https://picsum.photos/id/1015/600/600',
        imageHint: 'green valley',
        caption: 'Diskusi hebat di lokakarya Wirausaha Tani Muda hari ini! Begitu banyak ide inovatif untuk pertanian berkelanjutan. 🌾 #GardaLestari #AgroMaritim',
        likes: [],
        commentsCount: 12,
      },
      {
        authorId: 'user2_id',
        imageUrl: 'https://picsum.photos/id/103/600/600',
        imageHint: 'mangrove saplings',
        caption: 'Tim kami baru saja menyelesaikan acara penanaman mangrove di Jakarta Utara. Lebih dari 1000 bibit baru ditanam! Mari jaga kelestarian pesisir kita. 🌱 #Kehutanan #Konservasi',
        likes: ['user1_id'],
        commentsCount: 25,
      },
      {
        authorId: 'user3_id',
        imageUrl: 'https://picsum.photos/id/218/600/600',
        imageHint: 'coral reef underwater',
        caption: 'Menjelajahi keindahan Bunaken. Keanekaragaman hayati laut kita adalah harta yang harus kita lindungi bersama. 🐠 #Maritim #GardaLestari',
        likes: [],
        commentsCount: 34,
      },
    ];

    postsToSeed.forEach(post => {
      const postRef = doc(postsCollection);
      batch.set(postRef, { ...post, createdAt: Timestamp.now() });
    });

    await batch.commit();
  }
}

// Get all posts
export async function getPosts(currentUserId: string): Promise<PostWithAuthor[]> {
//   await seedPostsData(); // Uncomment to seed data
  
  const postsSnapshot = await getDocs(postsCollection);
  const posts: PostWithAuthor[] = [];

  for (const postDoc of postsSnapshot.docs) {
    const postData = { id: postDoc.id, ...postDoc.data() } as Post;

    // Get author details
    const authorDoc = await getDoc(doc(usersCollection, postData.authorId));
    const authorData = authorDoc.data() as Author || { name: 'Unknown User', avatarUrl: ''};

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

  // Sort by creation date, newest first
  return posts.sort((a, b) => {
    // This is a simplistic sort since timestamp is a string.
    // For real apps, sort based on the original timestamp before formatting.
    return b.timestamp.localeCompare(a.timestamp);
  });
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
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error("Gagal memperbarui status suka.");
  }
}
