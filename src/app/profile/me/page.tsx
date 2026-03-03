'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Pencil, Loader2, Award, PlusCircle, Coins, Target, History, Settings, UserCircle, IdCard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembershipCardDialog from '@/components/members/MembershipCardDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import VerificationFlow from '@/components/auth/VerificationFlow';

export default function ProfileMePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const isAdmin = user?.permissions && user.permissions.length > 0;

  return (
    <MainLayout>
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24">
            {/* simplified profile header */}
            <div className="flex flex-col items-center text-center space-y-6 pt-8">
                <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-2 ring-primary/20">
                      <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                      <AvatarFallback className="text-4xl bg-primary text-white">{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                        <VerifiedBadge type={user.type} className="h-10 w-10" />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">@{user?.username}</h1>
                    <p className="text-muted-foreground font-medium">{user?.displayName}</p>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full">{user?.position || 'Anggota GML'}</Badge>
                </div>
                
                <div className="flex gap-3 w-full max-w-sm">
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="flex-1 rounded-2xl h-12 shadow-sm">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Profil
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" className="flex-1 rounded-2xl h-12 shadow-lg shadow-primary/20" disabled={user?.verificationStatus !== 'permanent'}>
                                <IdCard className="mr-2 h-4 w-4" /> E-KTA
                            </Button>
                        </DialogTrigger>
                        <MembershipCardDialog user={user} />
                    </Dialog>
                </div>
            </div>

            {/* simple stats cards */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/points" className="block">
                    <Card className="bg-primary text-white border-none rounded-[2rem] hover:scale-[1.02] transition-all cursor-pointer shadow-xl shadow-primary/10 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 flex items-center justify-between relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Saldo Poin</p>
                                <p className="text-3xl font-black">{user?.greenPoints || 0}</p>
                            </div>
                            <Coins size={40} className="opacity-30 -rotate-12" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/points" className="block">
                    <Card className="bg-accent text-white border-none rounded-[2rem] hover:scale-[1.02] transition-all cursor-pointer shadow-xl shadow-accent/10 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 flex items-center justify-between relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Anggota Diajak</p>
                                <p className="text-3xl font-black">{user?.referralCount || 0}</p>
                            </div>
                            <Target size={40} className="opacity-30 rotate-12" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* simplified 3-tab system */}
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1.5 rounded-[2rem] h-14">
                    <TabsTrigger value="activity" className="rounded-full text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Aktivitas</TabsTrigger>
                    <TabsTrigger value="rewards" className="rounded-full text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Hadiah</TabsTrigger>
                    <TabsTrigger value="menu" className="rounded-full text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Menu</TabsTrigger>
                </TabsList>
                
                <TabsContent value="activity" className="space-y-4 pt-6">
                    <Card className="rounded-[2rem] border-none shadow-sm bg-secondary/20 p-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History size={16} className="text-primary"/> Program Terdaftar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Sprout className="text-primary/30" size={32} />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">Anda belum mengikuti program aksi apapun.</p>
                                <Button asChild variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                                    <Link href="/programs">Cari Program</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4 pt-6">
                    <Card className="rounded-[2rem] border-none shadow-sm bg-primary/5 overflow-hidden">
                        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                <Gift size={64} className="text-primary relative z-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-xl">Klaim Poin Hijau!</h3>
                                <p className="text-sm text-muted-foreground">Selesaikan misi konservasi atau ajak teman bergabung untuk mendapatkan poin yang bisa ditukar hadiah.</p>
                            </div>
                            <div className="flex gap-2 w-full">
                                <Button asChild className="flex-1 rounded-full h-12 font-bold shadow-lg shadow-primary/20"><Link href="/points">Tukar Hadiah</Link></Button>
                                <Button asChild variant="outline" className="flex-1 rounded-full h-12 font-bold"><Link href="/points?tab=missions">Cek Misi</Link></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="menu" className="space-y-3 pt-6">
                    <div className="grid gap-2">
                        {isAdmin && (
                            <Button variant="outline" asChild className="w-full justify-between rounded-2xl h-14 px-6 border-primary/10 hover:bg-primary/5 hover:border-primary/20 transition-all">
                                <Link href="/panel/dashboard" className="flex items-center">
                                    <Shield className="mr-3 h-5 w-5 text-primary" /> 
                                    <span className="font-bold">Panel Admin</span>
                                </Link>
                                <ArrowRight size={16} className="text-muted-foreground" />
                            </Button>
                        )}
                        <Button variant="outline" asChild className="w-full justify-between rounded-2xl h-14 px-6 border-muted hover:bg-muted/50 transition-all">
                            <Link href="/hapus-data" className="flex items-center">
                                <AlertTriangle className="mr-3 h-5 w-5 text-destructive/70" /> 
                                <span className="font-bold">Keamanan Data</span>
                            </Link>
                            <ArrowRight size={16} className="text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" onClick={signOut} className="w-full justify-start rounded-2xl h-14 px-6 text-destructive hover:bg-destructive/5 hover:text-destructive transition-all">
                            <LogOut className="mr-3 h-5 w-5" /> 
                            <span className="font-bold">Keluar Akun</span>
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user as any}
        />
    </MainLayout>
  );
}

function Badge({ className, variant, ...props }: any) {
    return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props} />
}