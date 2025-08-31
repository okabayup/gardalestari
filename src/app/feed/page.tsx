
'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PostCard, { Post } from '@/components/feed/PostCard';
import { placeholderPosts as initialPosts } from '@/lib/placeholder-data';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handleToggleLike = (postId: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const wasLiked = post.isLiked;
          return {
            ...post,
            isLiked: !wasLiked,
            likes: wasLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-4 md:p-6 md:space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={() => handleToggleLike(post.id)}
          />
        ))}
      </div>
    </MainLayout>
  );
}
