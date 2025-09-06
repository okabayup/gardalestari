
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getVotingTopics, VotingTopicDTO } from '@/app/actions/voting';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function EVotingListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topics, setTopics] = useState<VotingTopicDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const data = await getVotingTopics();
        setTopics(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat data E-Voting' });
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [toast]);

  const getStatus = (topic: VotingTopicDTO): { text: string; color: string; isActionable: boolean } => {
    const now = new Date();
    const startDate = new Date(topic.startDate);
    const endDate = new Date(topic.endDate);

    if (now < startDate) return { text: 'Akan Datang', color: 'bg-blue-500', isActionable: false };
    if (now > endDate) return { text: 'Selesai', color: 'bg-gray-500', isActionable: true };
    return { text: 'Aktif', color: 'bg-green-500', isActionable: true };
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-3xl font-bold">E-Voting</h1>
          <p className="text-muted-foreground">Berikan suara Anda untuk masa depan organisasi.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : topics.length > 0 ? (
          <div className="space-y-4">
            {topics.map(topic => {
              const status = getStatus(topic);
              return (
                <Card key={topic.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{topic.title}</CardTitle>
                      <Badge className={status.color}>{status.text}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {format(new Date(topic.startDate), 'dd MMM')} - {format(new Date(topic.endDate), 'dd MMM yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => router.push(`/evoting/${topic.id}`)} disabled={!status.isActionable}>
                      {status.text === 'Selesai' ? 'Lihat Hasil' : 'Beri Suara'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p>Tidak ada topik E-Voting yang tersedia saat ini.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
