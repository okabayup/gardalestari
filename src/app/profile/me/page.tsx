

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Pencil, AlertTriangle, Loader2, Grid3x3, Archive, Tag, IdCard, Undo, History, Award, Info, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPostsByUserId, getArchivedPosts, getTaggedPosts, PostWithAuthor, unarchivePost } from '@/app/actions/posts';
import { getAchievementsByUserId, Achievement } from '@/app/actions/achievements';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembershipCardDialog from '@/components/members/MembershipCardDialog';
import { useToast } from '@/hooks/use-toast';
import PostCard from '@/components/feed/PostCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MemberLevelBadge } from '@/components/members/MemberLevelBadge';
import { format } from 'date-fns';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const ProfileHeader = ({ user, postCount }: { user: any, postCount: number }) => (
  <Card>
    <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-4">
            <Avatar className="h-24 w-24 border">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
              <AvatarFallback className="text-3xl">{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold font-headline">{user?.displayName}</h1>
                <p className="text-muted-foreground">{user?.position || 'Anggota Garda Lestari'}</p>
                 <div className="flex items-center gap-2 pt-1">
                    <MemberLevelBadge level={user?.level || 'Bronze'} />
                    <span className="text-sm text-muted-foreground">{user?.points || 0} Poin</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => (document.getElementById('edit-profile-trigger') as HTMLButtonElement)?.click()} className="w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profil
            </Button>
            <Button variant="outline" onClick={() => (document.getElementById('kta-trigger') as HTMLButtonElement)?.click()} className="w-full" disabled={user?.verificationStatus !== 'permanent'}>
                <IdCard className="mr-2 h-4 w-4" />
                Lihat Verifikasi (Publik)
            </Button>
        </div>
    </CardContent>
  </Card>
);

const ProfilePostsGrid = ({ posts, isLoading }: { posts: PostWithAuthor[], isLoading: boolean }) => {
    if (isLoading) {
       return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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

const ArchivedPostsList = ({ posts, isLoading, onUnarchive }: { posts: PostWithAuthor[], isLoading: boolean, onUnarchive?: (postId: string) => void }) => {
    if (isLoading) {
       return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }
    if (!posts || posts.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Arsip kosong.</div>;
    }

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <PostCard 
                    key={post.id}
                    post={post}
                    onToggleLike={() => {}}
                    onArchive={() => {}}
                    onUnarchive={() => onUnarchive?.(post.id)}
                    currentUserId={post.author.id}
                />
            ))}
        </div>
    )
}

const AchievementList = ({ achievements, isLoading }: { achievements: Achievement[], isLoading: boolean }) => {
    const router = useRouter();

    if (isLoading) {
       return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }
    if (!achievements || achievements.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Award className="h-8 w-8 mx-auto mb-2"/>
                <p>Anda belum menambahkan prestasi.</p>
                 <Button size="sm" className="mt-4" onClick={() => router.push('/achievements/new')}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Tambah Prestasi
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
             <div className="text-right">
                <Button size="sm" onClick={() => router.push('/achievements/new')}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Tambah Prestasi
                </Button>
            </div>
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


const PlaceholderTab = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <Icon className="h-8 w-8 mx-auto mb-2" />
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm">{description}</p>
    </div>
)


const VerificationStatusAlert = ({ status }: { status?: 'unverified' | 'temporary' | 'permanent' | 'rejected' }) => {
    const router = useRouter();
    if (!status || status === 'unverified') {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verifikasi Akun</AlertTitle>
                <AlertDescription>
                    Akun Anda belum terverifikasi. Silakan lengkapi proses verifikasi untuk mendapatkan Kartu Tanda Anggota (KTA).
                    <Button className="mt-2 w-full" onClick={() => router.push('/profile/verify')}>Mulai Verifikasi</Button>
                </AlertDescription>
            </Alert>
        )
    }
     if (status === 'temporary') {
        return (
            <Alert className="border-yellow-500 text-yellow-800 dark:text-yellow-300 dark:border-yellow-700">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle>Verifikasi Sedang Ditinjau</AlertTitle>
                <AlertDescription>
                    Pengajuan verifikasi Anda sedang ditinjau oleh tim kami. Anda sudah bisa menggunakan fitur aplikasi.
                </AlertDescription>
            </Alert>
        )
    }
    if (status === 'rejected') {
         return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verifikasi Ditolak</AlertTitle>
                <AlertDescription>
                    Sayangnya, verifikasi Anda ditolak. Silakan coba lagi dengan data yang valid.
                    <Button variant="destructive" className="mt-2 w-full" onClick={() => router.push('/profile/verify')}>Ulangi Verifikasi</Button>
                </AlertDescription>
            </Alert>
        )
    }
    return null;
}


export default function ProfileMePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKtaModalOpen, setIsKtaModalOpen] = useState(false);
  
  const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<PostWithAuthor[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<PostWithAuthor[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);

  const [loadingUserPosts, setLoadingUserPosts] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(true);
  const [loadingTagged, setLoadingTagged] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(true);


  const fetchAllData = () => {
     if (user && !authLoading) {
      setLoadingUserPosts(true);
      getPostsByUserId(user.uid).then(posts => {
        setUserPosts(posts);
        setLoadingUserPosts(false);
      });

      setLoadingArchived(true);
      getArchivedPosts(user.uid).then(posts => {
        setArchivedPosts(posts);
        setLoadingArchived(false);
      });
      
      setLoadingTagged(true);
      getTaggedPosts(user.uid).then(posts => {
        setTaggedPosts(posts);
        setLoadingTagged(false);
      });

      setLoadingAchievements(true);
      getAchievementsByUserId(user.uid).then(achievements => {
          setUserAchievements(achievements);
          setLoadingAchievements(false);
      });
    }
  }

  useEffect(() => {
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleUnarchive = async (postId: string) => {
    setArchivedPosts(prev => prev.filter(p => p.id !== postId));
    try {
        await unarchivePost(postId);
        toast({ title: 'Postingan dipulihkan' });
        getPostsByUserId(user!.uid).then(setUserPosts);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memulihkan', description: (error as Error).message });
        fetchAllData();
    }
  };
  
  const isAdmin = user?.permissions?.length > 0;

  if (authLoading || !user) {
    return (
       <MainLayout>
         <div className="flex h-full items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </MainLayout>
     );
  }

  return (
    <MainLayout>
        <div className="p-4 space-y-4">
            <ProfileHeader user={user} postCount={userPosts.length} />
            <VerificationStatusAlert status={user?.verificationStatus} />
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full grid grid-cols-5">
                    <TabsTrigger value="posts"><Grid3x3 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Postingan</span></TabsTrigger>
                    <TabsTrigger value="tagged"><Tag className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Tagged</span></TabsTrigger>
                    <TabsTrigger value="achievements"><Award className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Prestasi</span></TabsTrigger>
                    <TabsTrigger value="history"><History className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Riwayat</span></TabsTrigger>
                    <TabsTrigger value="archive"><Archive className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Arsip</span></TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-4">
                    <ProfilePostsGrid posts={userPosts} isLoading={loadingUserPosts} />
                </TabsContent>
                 <TabsContent value="tagged" className="mt-4">
                    <ProfilePostsGrid posts={taggedPosts} isLoading={loadingTagged} />
                </TabsContent>
                 <TabsContent value="achievements" className="mt-4">
                    <AchievementList achievements={userAchievements} isLoading={loadingAchievements} />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                    <PlaceholderTab icon={History} title="Riwayat Program" description="Riwayat program yang pernah Anda ikuti akan ditampilkan di sini." />
                </TabsContent>
                 <TabsContent value="archive" className="mt-4">
                    <ArchivedPostsList posts={archivedPosts} isLoading={loadingArchived} onUnarchive={handleUnarchive} />
                </TabsContent>
            </Tabs>
             
            <div className="pt-4 space-y-2">
                {isAdmin && (
                    <Button variant="outline" onClick={() => router.push('/panel/dashboard')} className="w-full">
                        <Shield className="mr-2 h-4 w-4" />
                        Panel Admin
                    </Button>
                )}
                <Button variant="destructive" onClick={handleSignOut} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                </Button>
            </div>
        </div>
        {user && (
          <>
             {/* Hidden triggers for modals */}
            <button id="edit-profile-trigger" onClick={() => setIsEditModalOpen(true)} className="hidden">Edit</button>
            <button id="kta-trigger" onClick={() => setIsKtaModalOpen(true)} className="hidden">KTA</button>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
            />
            <MembershipCardDialog 
              isOpen={isKtaModalOpen}
              onClose={() => setIsKtaModalOpen(false)}
              user={user}
            />
          </>
        )}
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
