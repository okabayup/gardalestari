
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Pencil, AlertTriangle, Loader2, Grid3x3, Archive, Tag, IdCard, Undo, History, Award, Info, PlusCircle, Copy, Users, Coins } from 'lucide-react';
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
import { format } from 'date-fns';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import VerificationFlow from '@/components/auth/VerificationFlow';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const ProfileHeader = ({ user, postCount }: { user: any, postCount: number }) => {
    const { toast } = useToast();
    
    const copyReferralCode = () => {
        if (!user?.referralCode) return;
        navigator.clipboard.writeText(user.referralCode);
        toast({ title: 'Kode Rujukan Disalin!' });
    }
    
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
                <Avatar className="h-24 w-24 border">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                  <AvatarFallback className="text-3xl">{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                         <h1 className="text-2xl font-bold font-headline">@{user?.username}</h1>
                         <VerifiedBadge type={user.type} />
                    </div>
                    <p className="text-muted-foreground">{user?.displayName}</p>
                    <p className="text-sm pt-1">{user?.position || 'Anggota Garda Lestari'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{user?.referralCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Anggota Direkrut</p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{user?.greenPoints || 0}</p>
                    <p className="text-xs text-muted-foreground">Poin Hijau</p>
                </div>
            </div>

            {user?.referralCode && (
                 <div className="space-y-2">
                    <Label>Kode Rujukan Anda</Label>
                    <div className="flex items-center gap-2">
                        <Input value={user.referralCode} readOnly className="font-mono" />
                        <Button type="button" size="icon" variant="outline" onClick={copyReferralCode}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                 </div>
            )}
            
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => (document.getElementById('edit-profile-trigger') as HTMLButtonElement)?.click()} className="w-full">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profil
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={user?.verificationStatus !== 'permanent'}>
                            <IdCard className="mr-2 h-4 w-4" />
                            Lihat KTA
                        </Button>
                    </DialogTrigger>
                    <MembershipCardDialog user={user} />
                </Dialog>
            </div>
        </CardContent>
      </Card>
    )
}

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


const VerificationStatusAlert = ({ status, onStartVerification }: { status?: 'unverified' | 'temporary' | 'permanent' | 'rejected', onStartVerification: () => void }) => {
    if (!status || status === 'unverified') {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verifikasi Akun</AlertTitle>
                <AlertDescription>
                    Akun Anda belum terverifikasi. Silakan lengkapi proses verifikasi untuk mendapatkan Kartu Tanda Anggota (KTA).
                    <Button className="mt-2 w-full" onClick={onStartVerification}>Mulai Verifikasi</Button>
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
                    <Button variant="destructive" className="mt-2 w-full" onClick={onStartVerification}>Ulangi Verifikasi</Button>
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
  const [isVerificationFlowOpen, setIsVerificationFlowOpen] = useState(false);
  
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
        {isVerificationFlowOpen && <VerificationFlow />}
        <div className="p-4 space-y-4">
            <ProfileHeader user={user} postCount={userPosts.length} />
            <VerificationStatusAlert status={user?.verificationStatus} onStartVerification={() => setIsVerificationFlowOpen(true)} />

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
            <Dialog>
              <DialogTrigger asChild>
                 <button id="kta-trigger" className="hidden">Lihat KTA</button>
              </DialogTrigger>
              <MembershipCardDialog user={user} />
            </Dialog>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
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
