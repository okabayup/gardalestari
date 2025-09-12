
'use client';

import { formatFullName } from '@/lib/utils';

interface MemberCardProps {
  name: string;
  position: string;
  avatarUrl?: string;
  titlePrefix?: string;
  titlePostfix?: string;
}

export const MemberCard = ({ name, position, avatarUrl, titlePrefix, titlePostfix }: MemberCardProps) => {
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '';
  const fullName = formatFullName(name, titlePrefix, titlePostfix);

  return (
    <div className="text-center transition-all duration-300">
      <div
        className="relative mx-auto h-24 w-24 rounded-full bg-muted bg-cover bg-center shadow-md flex-shrink-0"
        style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }}
      >
        {!avatarUrl && (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-primary">
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="font-semibold leading-tight break-words text-sm">{fullName}</p>
        <p className="text-xs text-muted-foreground break-words mt-0.5">{position}</p>
      </div>
    </div>
  );
};
