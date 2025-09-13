
'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAchievements, Achievement } from '@/app/actions/achievements';
import { Loader2, Award } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  return (
    <Card className="overflow-hidden">
        {achievement.imageUrl && (
            <div className="relative h-40 w-full">
                <Image 
                    src={achievement.imageUrl} 
                    alt={achievement.title} 
                    fill 
                    className="object-cover"
                />
            </div>
        )}
        <CardHeader>
            <CardTitle>{achievement.title}</CardTitle>
            <CardDescription>{format(new Date(achievement.date), 'dd MMMM yyyy', { locale: id })}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2 mb-4">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={achievement.userAvatar} />
                    <AvatarFallback>{achievement.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{achievement.userName}</span>
            </div>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
        </CardContent>
    </Card>
  )
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .finally(() => setLoading(false));
  }, []);
  
  const years = [...new Set(achievements.map(a => new Date(a.date).getFullYear()))];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-3xl font-bold">Galeri Prestasi</h1>
          <p className="text-muted-foreground">Pencapaian gemilang dari para anggota Garda Lestari.</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {achievements.length > 0 ? (
              years.map(year => (
                <div key={year} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h2 className="font-headline text-2xl font-semibold">{year}</h2>
                        <Separator className="flex-1" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                    {achievements
                        .filter(a => new Date(a.date).getFullYear() === year)
                        .map((item) => (
                        <AchievementCard key={item.id} achievement={item} />
                        ))}
                    </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Award className="h-10 w-10" />
                  <span>Belum ada prestasi yang dicatat.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
