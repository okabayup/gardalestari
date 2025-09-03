
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { getPostsByUserId, getTaggedPosts, PostWithAuthor } from '@/app/actions/posts';
import { getUserByUsername, PublicUser } from '@/app/actions/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Loader2, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicProfileLayout from '@/components/layout/PublicProfileLayout';

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


const ProfilePostsGrid = ({ posts, isLoading }: { posts: PostWithAuthor[], isLoading: boolean }) => {
    if (isLoading) {
       return (
        <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
       )
    }

    if (!posts || posts.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Belum ada postingan.</div>;
    }

    return (
        <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
                <Link href={`/p/${post.id}`} key={post.id} className="relative aspect-square">
                   {post.media.length > 0 && (
                        <Image 
                            src={post.media[0].url}
                            alt="Postingan"
                            fill
                            className="object-cover"
                            data-ai-hint={post.media[0].hint}
                        />
                   )}
                </Link>
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
  const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingTagged, setLoadingTagged] = useState(true);

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
                return;
            }

            setUser(fetchedUser);

            setLoadingPosts(true);
            getPostsByUserId(fetchedUser.id).then(posts => {
                setUserPosts(posts);
                setLoadingPosts(false);
            });

            setLoadingTagged(true);
            getTaggedPosts(fetchedUser.id).then(posts => {
                setTaggedPosts(posts);
                setLoadingTagged(false);
            });
            
            setLoading(false);
        };
        fetchUserData();
    }
  }, [username, currentUser?.username, router]);

  if (loading) {
    return (
      <PublicProfileLayout>
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </PublicProfileLayout>
    );
  }

  return (
    <PublicProfileLayout>
        <div className="space-y-4 py-4">
            <ProfileHeader user={user} postCount={userPosts.length} />
            <ProfileBio user={user} />
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="posts">
                        <Grid3x3 className="mr-2 h-4 w-4" /> Postingan
                    </TabsTrigger>
                     <TabsTrigger value="tagged">
                        <Tag className="mr-2 h-4 w-4" /> Ditandai
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="posts">
                    <ProfilePostsGrid posts={userPosts} isLoading={loadingPosts} />
                </TabsContent>
                <TabsContent value="tagged">
                    <ProfilePostsGrid posts={taggedPosts} isLoading={loadingTagged} />
                </TabsContent>
            </Tabs>
        </div>
    </PublicProfileLayout>
  );
}
