

'use server';

import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAchievements, Achievement } from '@/app/actions/achievements';
import { Award } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { id as idLocale } from 'date-fns/locale/id';

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const formattedDate = format(new Date(achievement.date), 'dd MMMM yyyy', { locale: idLocale });

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
            <CardDescription>{formattedDate}</CardDescription>
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

export default async function AchievementsPage() {
  const achievements = await getAchievements();
  const years = [...new Set(achievements.map(a => new Date(a.date).getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <div className="container py-12 md:py-16">
        <div className="text-center sm:text-left mb-8">
          <h1 className="font-headline text-3xl font-bold">Galeri Prestasi</h1>
          <p className="text-muted-foreground">Pencapaian gemilang dari para anggota Garda Lestari.</p>
        </div>
          <div className="space-y-8">
            {achievements.length > 0 ? (
              years.map(year => (
                <div key={year} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h2 className="font-headline text-2xl font-semibold">{year}</h2>
                        <Separator className="flex-1" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
      <Footer />
    </div>
  );
}
