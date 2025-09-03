
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserByUsername, PublicProfile } from '@/app/actions/user';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PublicProfileLayout from '@/components/layout/PublicProfileLayout';
import { Loader2, ShieldAlert, BadgeCheck, MapPin, Calendar, Briefcase, UserCircle, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode.react';

const ProfileInfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
};

const getStatusInfo = (status: PublicProfile['verificationStatus']): { text: string; icon: React.ElementType, className: string } => {
    switch (status) {
        case 'permanent': return { text: 'Anggota Permanen', icon: BadgeCheck, className: 'text-green-600' };
        case 'temporary': return { text: 'Anggota Sementara', icon: BadgeCheck, className: 'text-yellow-600' };
        default: return { text: 'Bukan Anggota Sah', icon: ShieldAlert, className: 'text-red-600' };
    }
}

const InvalidKtaCard = () => (
    <Card className="m-4">
        <CardHeader className="items-center text-center">
             <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-destructive">KTA Tidak Sah</CardTitle>
            <CardDescription>
                Kartu Tanda Anggota dengan nama pengguna ini tidak ditemukan atau tidak valid. Pastikan Anda memiliki tautan yang benar.
            </CardDescription>
        </CardHeader>
    </Card>
);

const UserProfileCard = ({ user }: { user: PublicProfile }) => {
    const statusInfo = getStatusInfo(user.verificationStatus);
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <Card className="m-4 shadow-lg">
            <CardHeader className="items-center text-center bg-muted/30 pb-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                    <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || ''} />
                    <AvatarFallback className="text-3xl">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-1 pt-2">
                     <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl">{user.name}</CardTitle>
                        <VerifiedBadge type={user.type} />
                    </div>
                    <p className="text-muted-foreground">@{user.username}</p>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-center p-3 rounded-md bg-green-50 border border-green-200">
                    <statusInfo.icon className={cn("h-5 w-5 mr-2", statusInfo.className)} />
                    <p className={cn("font-semibold text-sm", statusInfo.className)}>{statusInfo.text}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileInfoRow icon={Briefcase} label="Jabatan" value={user.position} />
                    <ProfileInfoRow icon={Calendar} label="Tanggal Registrasi" value={user.joinDate} />
                    <ProfileInfoRow icon={MapPin} label="Lokasi Registrasi" value={user.region} />
                    <ProfileInfoRow icon={UserCircle} label="Tingkat" value={user.level} />
                </div>
                 <div className="flex flex-col items-center justify-center pt-4">
                    <QRCode value={profileUrl} size={100} level="L" />
                     <p className="text-xs text-muted-foreground mt-2">Pindai untuk verifikasi</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  const [user, setUser] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);

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

            if (!fetchedUser) {
                setIsInvalid(true);
            } else {
                setUser(fetchedUser);
            }
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
        <div className="py-4">
           {isInvalid ? <InvalidKtaCard /> : user && <UserProfileCard user={user} />}
        </div>
    </PublicProfileLayout>
  );
}
