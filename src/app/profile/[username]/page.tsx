
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserByUsername, PublicProfile } from '@/app/actions/user';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2, ShieldAlert, Award, Grid3x3, IdCard, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import MembershipCardDialog from '@/components/members/MembershipCardDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPostsByUserId, PostWithAuthor } from '@/app/actions/posts';
import { getAchievementsByUserId, Achievement } from '@/app/actions/achievements';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const ProfilePostsGrid = ({ posts, isLoading }: { posts: PostWithAuthor[], isLoading: boolean }) => {
    if (isLoading) {
       return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }
    if (!posts || posts.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Pengguna ini belum memiliki postingan.</div>;
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
                        />
                   )}
                </Link>
            ))}
        </div>
    )
}

const AchievementList = ({ achievements, isLoading }: { achievements: Achievement[], isLoading: boolean }) => {
    if (isLoading) {
       return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }
    if (!achievements || achievements.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Award className="h-8 w-8 mx-auto mb-2"/>
                <p>Pengguna ini belum memiliki prestasi.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {achievements.map(item => (
                <Card key={item.id}>
                    {item.imageUrl && (
                         <div className="relative h-32 w-full">
                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover rounded-t-lg" />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>
                            <ClientFormattedDate dateString={item.date} />
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
};


const InvalidProfileCard = () => (
    <Card className="m-4">
        <CardHeader className="items-center text-center">
             <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-destructive">Profil Tidak Ditemukan</CardTitle>
            <CardDescription>
                Pengguna dengan nama ini tidak ditemukan atau belum terverifikasi. Pastikan Anda memiliki tautan yang benar.
            </CardDescription>
        </CardHeader>
    </Card>
);

const UserProfileHeader = ({ user, postCount }: { user: PublicProfile, postCount: number }) => {
    const [isKtaModalOpen, setIsKtaModalOpen] = useState(false);
    
    return (
      <>
        <Card>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <Avatar className="h-24 w-24 border">
                    <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || ''} />
                    <AvatarFallback className="text-3xl">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <h1 className="text-2xl font-bold font-headline">{user?.name}</h1>
                             <VerifiedBadge type={user.type} />
                        </div>
                        <p className="text-muted-foreground">@{user?.username}</p>
                        <p className="text-sm pt-1">{user?.position || 'Anggota Garda Lestari'}</p>
                    </div>
                </div>
                <div className="flex items-center justify-around text-center">
                    <div>
                        <p className="font-bold text-lg">{postCount}</p>
                        <p className="text-xs text-muted-foreground">Postingan</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">0</p>
                        <p className="text-xs text-muted-foreground">Pengikut</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">0</p>
                        <p className="text-xs text-muted-foreground">Mengikuti</p>
                    </div>
                </div>
                 <Button variant="outline" onClick={() => setIsKtaModalOpen(true)} className="w-full">
                    <IdCard className="mr-2 h-4 w-4" />
                    Lihat KTA Digital
                </Button>
            </CardContent>
        </Card>
        <MembershipCardDialog 
          isOpen={isKtaModalOpen}
          onClose={() => setIsKtaModalOpen(false)}
          user={{
              ...user,
              uid: user.id, // Adapt PublicProfile to what MembershipCardDialog expects
              displayName: user.name,
              photoURL: user.avatarUrl,
              metadata: { creationTime: user.joinDate }
          } as any}
        />
      </>
    )
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  const [user, setUser] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);

  const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    if (username) {
        if(currentUser?.username === username) {
            router.replace('/profile/me');
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            setIsInvalid(false);
            const fetchedUser = await getUserByUsername(username);

            if (!fetchedUser || fetchedUser.verificationStatus !== 'permanent') {
                setIsInvalid(true);
            } else {
                setUser(fetchedUser);
                setLoadingContent(true);
                const [posts, achievements] = await Promise.all([
                    getPostsByUserId(fetchedUser.id),
                    getAchievementsByUserId(fetchedUser.id)
                ]);
                setUserPosts(posts);
                setUserAchievements(achievements);
                setLoadingContent(false);
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
  
  if (isInvalid || !user) {
    return (
      <MainLayout>
        <div className="py-4"><InvalidProfileCard /></div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
        <div className="p-4 space-y-4">
            <UserProfileHeader user={user} postCount={userPosts.length} />
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="posts"><Grid3x3 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Postingan</span></TabsTrigger>
                    <TabsTrigger value="achievements"><Award className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Prestasi</span></TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-4">
                    <ProfilePostsGrid posts={userPosts} isLoading={loadingContent} />
                </TabsContent>
                 <TabsContent value="achievements" className="mt-4">
                    <AchievementList achievements={userAchievements} isLoading={loadingContent} />
                </TabsContent>
            </Tabs>
        </div>
    </MainLayout>
  );
}

function ClientFormattedDate({ dateString }: { dateString: string }) {
    const [formattedDate, setFormattedDate] = useState('');
    useEffect(() => {
        const doFormat = async () => {
            const { id } = await import('date-fns/locale/id');
            const date = new Date(dateString);
            setFormattedDate(format(date, 'dd MMMM yyyy', { locale: id }));
        };
        doFormat();
    }, [dateString]);
    return <>{formattedDate || 'Memuat...'}</>;
}
