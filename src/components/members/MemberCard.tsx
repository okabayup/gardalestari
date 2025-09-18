

'use client';

import Link from 'next/link';
import { formatFullName } from '@/lib/utils';

interface MemberCardProps {
  name: string;
  username: string;
  position: string;
  avatarUrl?: string;
  titlePrefix?: string;
  titlePostfix?: string;
}

export const MemberCard = ({ name, username, position, avatarUrl, titlePrefix, titlePostfix }: MemberCardProps) => {
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '';
  const fullName = formatFullName(name, titlePrefix, titlePostfix);

  return (
    <Link href={`/profile/${username}`} className="text-center transition-all duration-300 group">
      <div
        className="relative mx-auto h-24 w-24 rounded-full bg-muted bg-cover bg-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"
        style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }}
      >
        {!avatarUrl && (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-primary">
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="font-semibold leading-tight break-words text-sm group-hover:text-primary">{fullName}</p>
        <p className="text-xs text-muted-foreground break-words mt-0.5">{position}</p>
      </div>
    </Link>
  );
};
