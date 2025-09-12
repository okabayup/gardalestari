
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatFullName } from '@/lib/utils';
import { cn } from '@/lib/utils';


interface MemberCardProps {
  name: string;
  position: string;
  avatarUrl?: string;
  titlePrefix?: string;
  titlePostfix?: string;
}

export const MemberCard = ({ name, position, avatarUrl, titlePrefix, titlePostfix }: MemberCardProps) => {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const fullName = formatFullName(name, titlePrefix, titlePostfix);

  return (
    <Card className="text-center h-full transition-all duration-300 hover:shadow-lg hover:bg-card/90">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        <Avatar className="mx-auto h-20 w-20 mb-3 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          <AvatarFallback className="text-xl">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow flex flex-col justify-center">
            <p className="font-semibold leading-tight break-words">{fullName}</p>
            <p className="text-xs text-muted-foreground break-words mt-0.5">{position}</p>
        </div>
      </CardContent>
    </Card>
  );
};
