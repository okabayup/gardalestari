
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { getPostsByUserId, PostWithAuthor } from '@/app/actions/posts';
import { getUserByUsername, PublicUser } from '@/app/actions/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const ProfileHeader = ({ user, postCount }: { user: PublicUser | null, postCount: number }) => (
  <div className="flex items-center gap-4 w-full px-4">
    <Avatar className="h-20 w-20">
      <AvatarImage src={user?.avatarUrl || ''} alt={user?.fullName || ''} />
      <AvatarFallback className="text-3xl">{user?.fullName?.charAt(0) || 'A'}</AvatarFallback>
    </Avatar>
    <div className="flex-1 grid grid-cols-2 text-center">
        <div>
            <p className="font-bold text-lg">{postCount}</p>
            <p className="text-sm text-muted-foreground">Postingan</p>
        </div>
         <div>
            <p className="font-bold text-lg">{user?.level || 'Bronze'}</p>
            <p className="text-sm text-muted-foreground">Level</p>
        </div>
    </div>
  </div>
);

const ProfileBio = ({ user }: { user: PublicUser | null }) => (
    <div className="px-4 space-y-1">
        <p className="font-bold">{user?.fullName}</p>
        <p className="text-sm text-muted-foreground">@{user?.username}</p>
        <p className="text-sm">Selamat datang di profil {user?.fullName}! Anggota Garda Lestari.</p>
    </div>
);


const ProfilePostsGrid = ({ posts }: { posts: PostWithAuthor[] }) => {
    if (!posts || posts.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Belum ada postingan.</div>;
    }

    return (
        <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
                <div key={post.id} className="relative aspect-square">
                   {post.media.length > 0 && (
                        <Image 
                            src={post.media[0].url}
                            alt="Postingan"
                            fill
                            className="object-cover"
                            data-ai-hint={post.media[0].hint}
                        />
                   )}
                </div>
            ))}
        </div>
    )
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
        // Redirect to /profile/me if the user is viewing their own profile
        if(currentUser?.username === username) {
            router.replace('/profile/me');
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            const fetchedUser = await getUserByUsername(username);

            if (!fetchedUser) {
                notFound();
            }

            setUser(fetchedUser);
            if (fetchedUser) {
                const userPosts = await getPostsByUserId(fetchedUser.id);
                setPosts(userPosts);
            }
            setLoading(false);
        };
        fetchUserData();
    }
  }, [username, currentUser?.username, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
        <div className="space-y-4 py-4">
            <ProfileHeader user={user} postCount={posts.length} />
            <ProfileBio user={user} />
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full grid grid-cols-1">
                    <TabsTrigger value="posts">
                        <Grid3x3 className="mr-2 h-4 w-4" /> Postingan
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="posts">
                    <ProfilePostsGrid posts={posts} />
                </TabsContent>
            </Tabs>
        </div>
    </MainLayout>
  );
}
