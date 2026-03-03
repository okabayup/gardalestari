
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Pencil, Loader2, Grid3x3, IdCard, Award, PlusCircle, Coins, Target, History } from 'lucide-react';
import Link from 'next/link';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembershipCardDialog from '@/components/members/MembershipCardDialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import VerificationFlow from '@/components/auth/VerificationFlow';

export default function ProfileMePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVerificationFlowOpen, setIsVerificationFlowOpen] = useState(false);

  if (authLoading || !user) {
    return (
       <MainLayout>
         <div className="flex h-full items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </MainLayout>
     );
  }

  if (user.verificationStatus === 'unverified') {
      return <VerificationFlow />;
  }

  const isAdmin = user?.permissions?.length > 0;

  return (
    <MainLayout>
        {isVerificationFlowOpen && <VerificationFlow />}
        <div className="p-4 space-y-6">
            {/* Header Profil Ringkas */}
            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                      <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                      <AvatarFallback className="text-3xl bg-primary text-white">{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                             <h1 className="text-2xl font-bold">@{user?.username}</h1>
                             <VerifiedBadge type={user.type} className="h-5 w-5" />
                        </div>
                        <p className="text-muted-foreground">{user?.displayName}</p>
                        <p className="text-sm font-semibold text-primary">{user?.position || 'Anggota'}</p>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="flex-1 rounded-full">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" className="flex-1 rounded-full" disabled={user?.verificationStatus !== 'permanent'}>
                                    <IdCard className="mr-2 h-4 w-4" /> KTA
                                </Button>
                            </DialogTrigger>
                            <MembershipCardDialog user={user} />
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            {/* Statistik Poin Cepat */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/points" className="block">
                    <Card className="bg-primary text-white border-none rounded-2xl hover:scale-105 transition-transform">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs opacity-80 uppercase font-bold">Saldo Poin</p>
                                <p className="text-2xl font-bold">{user?.greenPoints || 0}</p>
                            </div>
                            <Coins size={32} className="opacity-30" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/points" className="block">
                    <Card className="bg-accent text-white border-none rounded-2xl hover:scale-105 transition-transform">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs opacity-80 uppercase font-bold">Rujukan</p>
                                <p className="text-2xl font-bold">{user?.referralCount || 0}</p>
                            </div>
                            <Target size={32} className="opacity-30" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Dasbor Utama Sederhana */}
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-full h-12">
                    <TabsTrigger value="activity" className="rounded-full data-[state=active]:shadow-md">Aktivitas</TabsTrigger>
                    <TabsTrigger value="rewards" className="rounded-full data-[state=active]:shadow-md">Hadiah</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-full data-[state=active]:shadow-md">Menu</TabsTrigger>
                </TabsList>
                
                <TabsContent value="activity" className="space-y-4 pt-4">
                    <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><History size={16}/> Program Saya</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground py-4 text-center">Belum ada aktivitas program terdaftar.</p>
                        </CardContent>
                    </Card>
                    <Button variant="outline" asChild className="w-full rounded-xl border-dashed border-2 h-16 text-muted-foreground">
                        <Link href="/programs"><PlusCircle className="mr-2"/> Temukan Program Baru</Link>
                    </Button>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4 pt-4">
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <Award size={48} className="text-primary opacity-20" />
                        <h3 className="font-bold">Kumpulkan Poin, Tukar Hadiah!</h3>
                        <p className="text-xs text-muted-foreground">Selesaikan misi untuk mendapatkan poin hijau.</p>
                        <Button asChild className="rounded-full"><Link href="/points">Buka Toko Hadiah</Link></Button>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-2 pt-4">
                    {isAdmin && (
                        <Button variant="outline" asChild className="w-full justify-start rounded-xl h-12">
                            <Link href="/panel/dashboard"><Shield className="mr-3 h-4 w-4" /> Panel Admin</Link>
                        </Button>
                    )}
                    <Button variant="outline" asChild className="w-full justify-start rounded-xl h-12">
                        <Link href="/hapus-data"><AlertTriangle className="mr-3 h-4 w-4" /> Kelola Data</Link>
                    </Button>
                    <Button variant="destructive" onClick={signOut} className="w-full justify-start rounded-xl h-12">
                        <LogOut className="mr-3 h-4 w-4" /> Keluar Akun
                    </Button>
                </TabsContent>
            </Tabs>
        </div>

        <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user}
        />
    </MainLayout>
  );
}
