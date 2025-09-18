
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getUserByUsername, PublicProfile } from '@/app/actions/user';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MembershipCard from '@/components/members/MembershipCard';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { getAppSettings } from '@/app/actions/settings';


const InvalidProfileCard = () => (
    <Card className="m-4 max-w-sm mx-auto">
        <CardHeader className="items-center text-center">
             <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-destructive">Verifikasi Gagal</CardTitle>
            <CardDescription>
                Pengguna dengan nama ini tidak ditemukan atau belum terverifikasi. Pastikan Anda memiliki tautan yang benar.
            </CardDescription>
        </CardHeader>
    </Card>
);

export default function KtaVerificationPage() {
    const params = useParams();
    const username = params.username as string;

    const [user, setUser] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistrationOpen, setRegistrationOpen] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userData, settings] = await Promise.all([
                    getUserByUsername(username),
                    getAppSettings()
                ]);
                
                if (userData && userData.verificationStatus === 'permanent') {
                    setUser(userData);
                } else {
                    setUser(null);
                }
                setRegistrationOpen(settings.isRegistrationOpen);
            } catch (error) {
                 console.error("Failed to fetch user data for verification", error);
                 setUser(null);
            } finally {
                 setLoading(false);
            }
        };

        if (username) {
            fetchData();
        }
    }, [username]);
    
    const getMemberId = (user: PublicProfile) => {
        const year = user.joinDate ? new Date(user.joinDate).getFullYear() : new Date().getFullYear();
        const phoneSuffix = String(user.phoneNumber).slice(-6);
        return `GL-${year}-${phoneSuffix}`;
    }
  
    const getJoinDate = (user: PublicProfile) => {
        if (!user.joinDate) return '';
        return new Date(user.joinDate).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const getVerificationUrl = (user: PublicProfile) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/kta/${user.username}`;
    }

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <LandingHeader isRegistrationOpen={isRegistrationOpen} />
            <main className="flex-1 flex items-center justify-center p-4">
                 {loading ? (
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                 ) : user ? (
                    <MembershipCard 
                        name={user.name}
                        photoUrl={user.avatarUrl || ''}
                        memberId={getMemberId(user)}
                        nik={undefined} // Hide NIK on public page
                        profileUrl={getVerificationUrl(user)}
                        memberType={user.type}
                        joinDate={getJoinDate(user)}
                        position={user.position}
                    />
                 ) : (
                    <InvalidProfileCard />
                 )}
            </main>
            <Footer />
        </div>
    )
}
