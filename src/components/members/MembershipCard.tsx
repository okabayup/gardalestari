
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { MemberType } from '@/app/actions/members';
import QRCode from 'qrcode.react';

interface MembershipCardProps {
    name: string;
    photoUrl: string;
    memberId: string;
    nik?: string;
    profileUrl: string;
    memberType?: MemberType;
    joinDate?: string;
    position?: string;
}

export default function MembershipCard({ name, photoUrl, memberId, nik, profileUrl, memberType, joinDate, position }: MembershipCardProps) {
    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '';

    return (
        <Card className="w-full max-w-sm bg-white text-foreground shadow-lg relative overflow-hidden border-2 border-gray-100">
             <div className="absolute top-0 left-0 w-full h-24 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)' }}></div>
             <div className="absolute inset-0 bg-[url(/logo.png)] bg-repeat bg-center opacity-[0.02]"></div>

            <CardHeader className="relative z-10 pt-4 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                     <div className="bg-white/90 rounded-full p-1 w-10 h-10 flex items-center justify-center">
                        <Image src="/logo.png" alt="Garda Lestari Logo" width={32} height={32} />
                    </div>
                    <CardTitle className="font-headline text-xl text-primary">Garda Lestari</CardTitle>
                </div>
                 <p className="text-sm text-primary/90 font-bold tracking-widest mt-1">E-KTA</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 relative z-10 p-4 pt-8 text-center">
                <Avatar className="h-28 w-28 border-4 border-white shadow-md -mt-16">
                    <AvatarImage src={photoUrl} alt={name} />
                    <AvatarFallback className="text-3xl text-primary">{getInitials(name)}</AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-xl font-bold font-headline leading-tight text-primary">{name}</p>
                      <VerifiedBadge type={memberType} className="h-5 w-5 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground -mt-1">{position || 'Anggota'}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full text-left pt-2">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">NIK</p>
                        <p className="font-mono tracking-wide text-sm">{nik || 'Belum Terverifikasi'}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground uppercase">ID Anggota</p>
                        <p className="font-mono tracking-wide text-sm">{memberId}</p>
                    </div>
                    {joinDate && (
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Bergabung Sejak</p>
                            <p className="font-mono text-sm tracking-wide">{joinDate}</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-2 rounded-md shadow mt-2">
                    <QRCode value={profileUrl} size={80} level="L" />
                </div>
            </CardContent>
        </Card>
    );
};
