
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

const ADMIN_PHONE_NUMBER = '+6285176752610';

const MembershipCard = ({ name, email, photoUrl, memberId }: { name: string, email: string, photoUrl: string, memberId: string }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

    return (
        <Card className="w-full max-w-sm bg-gradient-to-br from-primary via-green-700 to-accent text-primary-foreground shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="h-8 w-8" />
                        <CardTitle className="font-headline text-xl">Garda Lestari</CardTitle>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest">Anggota</span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
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


export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  const memberId = user ? `GL-${new Date().getFullYear()}-${String(user.phoneNumber).slice(-6)}` : '';
  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  return (
    <MainLayout>
        <div className="p-4 space-y-6 flex flex-col items-center">
             <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold font-headline">Profil Anggota</h1>
                    <p className="text-muted-foreground">Ini adalah Kartu Tanda Anggota (KTA) digital Anda.</p>
                </div>
                {user && (
                    <MembershipCard
                        name={user?.displayName || 'Anggota Baru'}
                        email={user?.email || (user?.phoneNumber || '')}
                        photoUrl={user?.photoURL || ''}
                        memberId={memberId}
                    />
                )}
                <div className="w-full max-w-sm space-y-2">
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
    </MainLayout>
  );
}
