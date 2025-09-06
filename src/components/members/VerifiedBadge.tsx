
'use client';

import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MemberType } from '@/app/actions/members';

interface VerifiedBadgeProps {
  type?: MemberType;
  className?: string;
}

const typeConfig: Record<MemberType, string> = {
  // The 'fill' class sets the badge color, 'stroke-background' makes the checkmark transparent
  pusat: 'fill-black dark:fill-white stroke-background dark:stroke-background',
  daerah: 'fill-blue-500 stroke-background dark:stroke-background',
  cabang: 'fill-yellow-500 stroke-background dark:stroke-background',
  pembina: 'fill-purple-500 stroke-background dark:stroke-background',
  pengawas: 'fill-red-500 stroke-background dark:stroke-background',
  penasehat: 'fill-green-500 stroke-background dark:stroke-background',
};


export const VerifiedBadge = ({ type, className }: VerifiedBadgeProps) => {
  if (!type || !typeConfig[type]) {
    return null;
  }

  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="flex-shrink-0" title={`Anggota Terverifikasi: ${title}`}>
        <BadgeCheck className={cn('h-4 w-4', typeConfig[type], className)} />
    </div>
  );
};
