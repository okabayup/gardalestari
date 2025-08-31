
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Star, Shield, Gem } from 'lucide-react';
import { MemberLevelBadge } from '@/components/members/MemberLevelBadge';

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
  { level: 'Bronze' as const, icon: Star, benefits: levelBenefits.Bronze, description: 'Level awal untuk semua anggota baru.' },
  { level: 'Silver' as const, icon: Shield, benefits: levelBenefits.Silver, description: 'Untuk anggota yang aktif berkontribusi.' },
  { level: 'Gold' as const, icon: Award, benefits: levelBenefits.Gold, description: 'Diberikan untuk kontribusi dan loyalitas yang signifikan.' },
  { level: 'Platinum' as const, icon: Gem, benefits: levelBenefits.Platinum, description: 'Level tertinggi untuk anggota paling berpengaruh.' }
]

const BenefitListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
    <span className="text-muted-foreground">{children}</span>
  </li>
);

export default function LevelPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Level Keanggotaan</h1>
          <p className="text-muted-foreground">Naikkan level Anda dengan berkontribusi aktif.</p>
        </div>
        
        <div className="space-y-4">
          {levelData.map(({ level, icon: Icon, benefits, description }) => (
            <Card key={level}>
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        <MemberLevelBadge level={level} size="lg" />
                    </div>
                    <div className="flex-grow">
                        <CardTitle className="text-xl">{level}</CardTitle>
                        <CardDescription>{description}</CardDescription>
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
