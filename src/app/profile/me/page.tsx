
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Pencil, AlertTriangle, Loader2, Grid3x3, Archive, Tag, IdCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPostsByUserId, getArchivedPosts, getTaggedPosts, PostWithAuthor } from '../../actions/posts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembershipCardDialog from '@/components/members/MembershipCardDialog';


const ADMIN_PHONE_NUMBER = '+6285176752610';

const ProfileHeader = ({ user, postCount }: { user: any, postCount: number }) => (
  <div className="flex items-center gap-4 w-full px-4">
    <Avatar className="h-20 w-20">
      <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
      <AvatarFallback className="text-3xl">{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
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

const ProfileBio = ({ user }: { user: any }) => (
    <div className="px-4 space-y-1">
        <p className="font-bold">{user?.displayName}</p>
        <p className="text-sm text-muted-foreground">@{user?.username}</p>
        {/* Placeholder for bio */}
        <p className="text-sm">Selamat datang di profil saya! Anggota Garda Lestari.</p>
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

const VerificationStatusAlert = ({ status }: { status?: 'unverified' | 'temporary' | 'permanent' | 'rejected' }) => {
    const router = useRouter();
    if (!status || status === 'unverified') {
        return (
            <Alert className="mx-4">
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
            <Alert className="mx-4 border-yellow-500 text-yellow-800">
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
            <Alert variant="destructive" className="mx-4">
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKtaModalOpen, setIsKtaModalOpen] = useState(false);
  
  const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<PostWithAuthor[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<PostWithAuthor[]>([]);

  const [loadingUserPosts, setLoadingUserPosts] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(true);
  const [loadingTagged, setLoadingTagged] = useState(true);


  useEffect(() => {
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
    }
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

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
        <div className="space-y-4 py-4">
            <ProfileHeader user={user} postCount={userPosts.length} />
            <ProfileBio user={user} />

            <div className="grid grid-cols-2 gap-2 px-4">
                 <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="w-full">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profil
                </Button>
                <Button variant="outline" onClick={() => setIsKtaModalOpen(true)} className="w-full" disabled={user.verificationStatus !== 'permanent'}>
                    <IdCard className="mr-2 h-4 w-4" />
                    Lihat KTA
                </Button>
            </div>
            
            <div className="px-4">
                 <VerificationStatusAlert status={user?.verificationStatus} />
            </div>

            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="posts">
                        <Grid3x3 className="mr-2 h-4 w-4" /> Postingan
                    </TabsTrigger>
                    <TabsTrigger value="tagged">
                        <Tag className="mr-2 h-4 w-4" /> Ditandai
                    </TabsTrigger>
                    <TabsTrigger value="archived">
                        <Archive className="mr-2 h-4 w-4" /> Diarsipkan
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="posts">
                    <ProfilePostsGrid posts={userPosts} isLoading={loadingUserPosts} />
                </TabsContent>
                 <TabsContent value="tagged">
                    <ProfilePostsGrid posts={taggedPosts} isLoading={loadingTagged} />
                </TabsContent>
                <TabsContent value="archived">
                    <ProfilePostsGrid posts={archivedPosts} isLoading={loadingArchived} />
                </TabsContent>
            </Tabs>
             
            <div className="px-4 space-y-2">
                {isAdmin && (
                    <Button variant="outline" onClick={() => router.push('/admin')} className="w-full">
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
