
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { MemberType } from '@/app/actions/members';

interface MembershipCardProps {
    name: string;
    photoUrl: string;
    memberId: string;
    memberType?: MemberType;
    joinDate?: string;
}

export default function MembershipCard({ name, photoUrl, memberId, memberType, joinDate }: MembershipCardProps) {
    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '';

    return (
        <Card className="w-full max-w-sm bg-gradient-to-br from-primary via-green-700 to-accent text-primary-foreground shadow-2xl relative overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Image src="/logo.png" alt="Garda Lestari Logo" width={32} height={32} />
                        <CardTitle className="font-headline text-xl">Garda Lestari</CardTitle>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest bg-black/20 px-2 py-1 rounded">Anggota</span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-24 w-24 border-4 border-background/50">
                    <AvatarImage src={photoUrl} alt={name} />
                    <AvatarFallback className="text-3xl text-primary">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold font-headline">{name}</p>
                    <VerifiedBadge type={memberType} className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs opacity-80 uppercase">ID Anggota</p>
                    <p className="font-mono text-lg tracking-wider">{memberId}</p>
                </div>
            </CardContent>
            {joinDate && (
                <div className="text-center text-xs opacity-80 pb-4">
                    Bergabung Sejak: {joinDate}
                </div>
            )}
             <div className="absolute -bottom-8 -right-8 w-24 h-24 opacity-10">
                <Image src="/logo.png" alt="" fill className="grayscale" />
            </div>
        </Card>
    );
};
