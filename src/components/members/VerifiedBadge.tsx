
'use client';

import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MemberType } from '@/app/actions/members';

interface VerifiedBadgeProps {
  type?: MemberType;
  className?: string;
}

const typeConfig: Record<MemberType, string> = {
  pusat: 'text-black dark:text-white fill-black dark:fill-white',
  daerah: 'text-blue-500 fill-blue-500',
  cabang: 'text-yellow-500 fill-yellow-500',
  pembina: 'text-purple-500 fill-purple-500',
};


export const VerifiedBadge = ({ type, className }: VerifiedBadgeProps) => {
  if (!type || !['pusat', 'daerah', 'cabang'].includes(type)) {
    return null;
  }

  return (
    <div className="flex-shrink-0" title={`Anggota Terverifikasi: ${type.charAt(0).toUpperCase() + type.slice(1)}`}>
        <BadgeCheck className={cn('h-4 w-4', typeConfig[type], className)} />
    </div>
  );
};
