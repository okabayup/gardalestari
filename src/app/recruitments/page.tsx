
'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getRecruitments, Recruitment } from '@/app/actions/recruitments';
import { Loader2, Briefcase, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Timestamp } from 'firebase/firestore';

const RecruitmentCard = ({ recruitment }: { recruitment: Recruitment }) => {
  const isPast = new Date() > recruitment.deadline.toDate();
  
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <div className="space-y-1.5">
                <CardTitle>{recruitment.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={recruitment.partnerLogoUrl} />
                        <AvatarFallback>{recruitment.partnerName?.charAt(0) || 'G'}</AvatarFallback>
                    </Avatar>
                    <span>{recruitment.partnerName || 'Garda Lestari'}</span>
                </div>
            </div>
             <Badge variant={recruitment.type === 'internal' ? 'default' : 'secondary'}>
                {recruitment.type === 'internal' ? 'Internal' : 'Mitra'}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {recruitment.description}
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3">
        <div className="text-xs text-muted-foreground">
            Batas Waktu: {format(recruitment.deadline.toDate(), 'dd MMMM yyyy', { locale: id })}
        </div>
        <Button asChild className="w-full" disabled={isPast}>
            <Link href={recruitment.applicationUrl} target="_blank">
                {isPast ? 'Pendaftaran Ditutup' : 'Lamar Sekarang'}
                {!isPast && <ArrowRight className="ml-2 h-4 w-4" />}
            </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function RecruitmentsPage() {
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruitments = async () => {
      setLoading(true);
      try {
        const data = await getRecruitments();
        const now = Timestamp.now();
        // Filter out recruitments where the deadline has passed
        const activeRecruitments = data.filter(r => r.deadline >= now);
        setRecruitments(activeRecruitments);
      } catch (e) {
        console.error("Failed to fetch recruitments", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecruitments();
  }, []);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-3xl font-bold">Peluang Rekrutmen</h1>
          <p className="text-muted-foreground">Temukan kesempatan karir di Garda Lestari dan mitra kami.</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {recruitments.length > 0 ? (
              recruitments.map((item) => (
                <RecruitmentCard key={item.id} recruitment={item} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Briefcase className="h-10 w-10" />
                  <span>Tidak ada lowongan yang tersedia saat ini.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
