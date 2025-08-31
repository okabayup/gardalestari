
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Pencil, AlertTriangle, BadgeCheck, Clock } from 'lucide-react';
import Image from 'next/image';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const MembershipCard = ({ name, email, photoUrl, memberId, status }: { name: string, email: string, photoUrl: string, memberId: string, status?: string }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const statusText = status === 'temporary' ? 'Anggota Sementara' : 'Anggota Terverifikasi';

    return (
        <Card className="w-full max-w-sm bg-gradient-to-br from-primary via-green-700 to-accent text-primary-foreground shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest">{statusText}</span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center pt-6">
                <Avatar className="h-24 w-24 border-4 border-background/50">
                    <AvatarImage src={photoUrl} alt={name} />
                    <AvatarFallback className="text-3xl text-primary">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-2xl font-bold font-headline">{name}</p>
                    <p className="text-sm opacity-80">{email}</p>
                </div>
                <div>
                    <p className="text-xs opacity-80 uppercase">ID Anggota</p>
                    <p className="font-mono text-lg tracking-wider">{memberId}</p>
                </div>
            </CardContent>
        </Card>
    );
};

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


export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  const memberId = user ? `GL-${new Date().getFullYear()}-${String(user.phoneNumber).slice(-6)}` : '';
  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  const isVerified = user?.verificationStatus === 'temporary' || user?.verificationStatus === 'permanent';

  return (
    <MainLayout>
        <div className="p-6 space-y-8 flex flex-col items-center">
             <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold font-headline">Profil Anggota</h1>
                    {isVerified ? (
                       <p className="text-muted-foreground">Ini adalah Kartu Tanda Anggota (KTA) digital Anda.</p>
                    ) : (
                       <p className="text-muted-foreground">Lengkapi profil dan verifikasi akun Anda.</p>
                    )}
                </div>
                {user && isVerified && (
                    <MembershipCard
                        name={user?.displayName || 'Anggota Baru'}
                        email={user?.email || (user?.phoneNumber || '')}
                        photoUrl={user?.photoURL || ''}
                        memberId={memberId}
                        status={user.verificationStatus}
                    />
                )}
                 {user && !isVerified && (
                    <VerificationStatusAlert status={user.verificationStatus} />
                )}
                <div className="w-full max-w-sm space-y-2">
                    <Button variant="default" onClick={() => setIsEditModalOpen(true)} className="w-full">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profil
                    </Button>
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
        </div>
        {user && (
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
            />
        )}
    </MainLayout>
  );
}
