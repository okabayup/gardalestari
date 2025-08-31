
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Star, Shield, Gem, Award, ArrowRight, Check } from 'lucide-react';
import { MemberLevelBadge } from '@/components/members/MemberLevelBadge';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { missions, levelRequirements } from '@/lib/missions';
import { Separator } from '@/components/ui/separator';

const levelBenefits = {
  Bronze: [
    'Akses ke buletin bulanan',
    'Partisipasi di forum komunitas',
    'Diskon 5% untuk merchandise',
  ],
  Silver: [
    'Semua benefit Bronze',
    'Akses prioritas ke acara & lokakarya',
    'Sesi Q&A eksklusif dengan para ahli',
    'Diskon 10% untuk merchandise',
  ],
  Gold: [
    'Semua benefit Silver',
    'Satu sesi mentoring per kuartal',
    'Akses ke konten premium',
    'Lencana profil Gold yang menonjol',
  ],
  Platinum: [
    'Semua benefit Gold',
    'Undangan ke acara khusus dewan pembina',
    'Kesempatan berkolaborasi dalam proyek Garda Lestari',
    'Akses langsung ke jaringan pimpinan',
  ]
};

const levelData = [
  { level: 'Bronze' as const, icon: Star, benefits: levelBenefits.Bronze },
  { level: 'Silver' as const, icon: Shield, benefits: levelBenefits.Silver },
  { level: 'Gold' as const, icon: Award, benefits: levelBenefits.Gold },
  { level: 'Platinum' as const, icon: Gem, benefits: levelBenefits.Platinum }
]

const BenefitListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
    <span className="text-muted-foreground">{children}</span>
  </li>
);

export default function LevelPage() {
  const { user } = useAuth();
  const currentUserLevel = user?.level || 'Bronze';
  const currentPoints = user?.points || 0; // Assume user object has points, default to 0

  const nextLevel = currentUserLevel === 'Bronze' ? 'Silver' : currentUserLevel === 'Silver' ? 'Gold' : currentUserLevel === 'Gold' ? 'Platinum' : 'Platinum';
  const pointsForNextLevel = levelRequirements[nextLevel];
  const progressPercentage = currentUserLevel === 'Platinum' ? 100 : Math.min((currentPoints / pointsForNextLevel) * 100, 100);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Level Keanggotaan</h1>
          <p className="text-muted-foreground">Naikkan level Anda dengan berkontribusi aktif.</p>
        </div>
        
        {/* User's Current Level Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Level Anda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <MemberLevelBadge level={currentUserLevel} />
              <div className="text-right">
                <p className="font-bold text-lg">{currentUserLevel}</p>
                <p className="text-sm text-muted-foreground">{currentPoints.toLocaleString()} Poin</p>
              </div>
            </div>
            {currentUserLevel !== 'Platinum' && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progres ke {nextLevel}</span>
                  <span>{currentPoints.toLocaleString()} / {pointsForNextLevel.toLocaleString()}</span>
                </div>
                <Progress value={progressPercentage} />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Missions Section */}
         <Card>
          <CardHeader>
            <CardTitle>Misi Level-Up</CardTitle>
            <CardDescription>Selesaikan misi untuk mendapatkan poin dan naik level!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {missions.map((mission, index) => (
               <div key={index} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <p className="font-medium text-sm">{mission.description}</p>
                  <div className="text-right">
                    <p className="font-bold text-primary">+{mission.points} Poin</p>
                  </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />
        
        {/* Level Details */}
        <div className="space-y-4">
          <h2 className="font-headline text-2xl font-bold text-center">Detail Keuntungan Level</h2>
          {levelData.map(({ level, benefits }) => (
            <Card key={level}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                      <MemberLevelBadge level={level} size="lg" />
                  </div>
                  <div className="flex-grow">
                      <CardTitle className="text-xl">{level}</CardTitle>
                      <CardDescription>Keuntungan level {level}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {benefits.map((benefit) => (
                    <BenefitListItem key={benefit}>{benefit}</BenefitListItem>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

    