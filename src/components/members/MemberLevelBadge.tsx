
'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Star, Shield, Award, Gem } from 'lucide-react';

interface MemberLevelBadgeProps {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  size?: 'sm' | 'lg';
}

const levelConfig = {
  Bronze: {
    icon: Star,
    className: 'bg-yellow-700/20 text-yellow-700 border-yellow-700/30 hover:bg-yellow-700/30',
    iconClassName: 'text-yellow-700'
  },
  Silver: {
    icon: Shield,
    className: 'bg-gray-400/20 text-gray-600 border-gray-400/30 hover:bg-gray-400/30',
    iconClassName: 'text-gray-600'
  },
  Gold: {
    icon: Award,
    className: 'bg-amber-400/20 text-amber-600 border-amber-400/30 hover:bg-amber-400/30',
    iconClassName: 'text-amber-600'
  },
  Platinum: {
    icon: Gem,
    className: 'bg-sky-400/20 text-sky-600 border-sky-400/30 hover:bg-sky-400/30',
    iconClassName: 'text-sky-600'
  }
};

export const MemberLevelBadge = ({ level, size = 'sm' }: MemberLevelBadgeProps) => {
  const config = levelConfig[level] || levelConfig.Bronze;
  const Icon = config.icon;

  if (size === 'lg') {
    return (
        <div className={cn("flex items-center justify-center h-16 w-16 rounded-full", config.className.replace('text-', 'bg-').replace('border-','bg-').replace('/20','/10'))}>
            <Icon className={cn("h-8 w-8", config.iconClassName)} />
        </div>
    )
  }

  return (
    <Badge variant="outline" className={cn("gap-1 pl-1.5 pr-2", config.className)}>
      <Icon className={cn("h-3 w-3", config.iconClassName)} />
      {level}
    </Badge>
  );
};
