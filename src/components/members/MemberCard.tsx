
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatFullName } from '@/lib/utils';

interface MemberCardProps {
  name: string;
  position: string;
  avatarUrl?: string;
  titlePrefix?: string;
  titlePostfix?: string;
}

export const MemberCard = ({ name, position, avatarUrl, titlePrefix, titlePostfix }: MemberCardProps) => {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');
  const fullName = formatFullName(name, titlePrefix, titlePostfix);

  return (
    <Card className="text-center h-full">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        <Avatar className="mx-auto h-16 w-16 mb-2 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow flex flex-col justify-center">
            <p className="font-semibold leading-tight break-words">{fullName}</p>
            <p className="text-xs text-muted-foreground break-words">{position}</p>
        </div>
      </CardContent>
    </Card>
  );
};
