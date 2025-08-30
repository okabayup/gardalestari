import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface MemberCardProps {
  name: string;
  role: string;
  avatarUrl: string;
}

export const MemberCard = ({ name, role, avatarUrl }: MemberCardProps) => {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="text-center">
      <CardContent className="p-4">
        <Avatar className="mx-auto h-16 w-16">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <p className="mt-2 font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </CardContent>
    </Card>
  );
};
