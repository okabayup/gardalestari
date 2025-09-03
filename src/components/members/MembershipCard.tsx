
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card className="w-full max-w-sm shadow-lg relative overflow-hidden font-sans bg-white">
             {/* Background Pattern */}
             <div
              className="absolute inset-0 bg-repeat bg-center opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
            
            {/* Header Curve */}
            <div className="absolute top-0 left-0 w-full h-32 bg-primary" style={{ clipPath: 'ellipse(100% 70% at 50% 0%)' }}></div>
            
            <CardContent className="flex flex-col items-center gap-4 relative z-10 p-6 pt-4 text-center">
                
                {/* Header Section */}
                 <div className="w-full flex flex-col items-center text-white mb-2">
                    <div className="flex items-center gap-2">
                         <Image src="/logo.png" alt="Garda Lestari Logo" width={24} height={24} className="brightness-0 invert" />
                         <h2 className="font-headline text-xl font-bold tracking-wider">Garda Lestari</h2>
                    </div>
                    <p className="text-xs opacity-80">Kartu Tanda Anggota</p>
                </div>


                {/* Avatar */}
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                    <AvatarImage src={photoUrl} alt={name} referrerPolicy="no-referrer" />
                    <AvatarFallback className="text-3xl text-primary">{getInitials(name)}</AvatarFallback>
                </Avatar>

                {/* Info Section */}
                <div className="space-y-1 -mt-2">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-xl font-bold font-headline leading-tight text-primary">{name}</p>
                      <VerifiedBadge type={memberType} className="h-5 w-5 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground -mt-1">{position || 'Anggota'}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full text-left pt-2 text-foreground">
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

                <div className="bg-white p-2 rounded-lg shadow-inner mt-2">
                    <QRCode value={profileUrl} size={80} level="L" />
                </div>
            </CardContent>
        </Card>
    );
};
