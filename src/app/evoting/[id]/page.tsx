
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getVotingTopic, castVote, VotingTopicDTO } from '@/app/actions/voting';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Check, Info, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';


const VotingResultDisplay = ({ topic }: { topic: VotingTopicDTO }) => (
    <div className="space-y-4">
        {topic.totalVotes > 0 ? (
           <div className="space-y-4">
                {topic.options.map(option => {
                    const percentage = topic.totalVotes > 0 ? (option.voteCount / topic.totalVotes) * 100 : 0;
                    return (
                        <div key={option.id} className="space-y-2">
                           <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    {option.imageUrl ? (
                                        <Image src={option.imageUrl} alt={option.name} width={40} height={40} className="rounded-full w-10 h-10 object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <span className="font-medium">{option.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{option.voteCount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                        </div>
                    )
                })}
           </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada suara yang masuk.</p>
        )}
    </div>
);


export default function EVotingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<VotingTopicDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  useEffect(() => {
    if (topicId) {
      const fetchTopic = async () => {
        setLoading(true);
        try {
          const data = await getVotingTopic(topicId);
          setTopic(data);
          if (user && data?.voterIds.includes(user.uid)) {
            setHasVoted(true);
          }
        } catch (error) {
          console.error("Failed to fetch voting topic:", error);
          toast({ variant: 'destructive', title: 'Gagal memuat topik' });
        } finally {
          setLoading(false);
        }
      };
      fetchTopic();
    }
  }, [topicId, user, toast]);

  const handleVote = async () => {
    if (!user || !selectedOption || !topic || !topic.id) return;
    setSubmitting(true);
    try {
      await castVote(topic.id, selectedOption, user.uid);
      toast({ title: 'Suara berhasil dikirim!', description: 'Terima kasih atas partisipasi Anda.' });
      setHasVoted(true);
      const data = await getVotingTopic(topicId);
      setTopic(data);
    } catch (error) {
      console.error("Failed to cast vote:", error);
      toast({ variant: 'destructive', title: 'Gagal memberikan suara', description: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!topic) {
    return (
      <MainLayout>
        <div className="p-6 text-center">Topik tidak ditemukan.</div>
      </MainLayout>
    );
  }
  
  const isVotingActive = new Date() >= new Date(topic.startDate) && new Date() <= new Date(topic.endDate);
  const canVote = !hasVoted && isVotingActive;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        {topic.coverImageUrl && (
            <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image src={topic.coverImageUrl} alt={topic.title} fill className="object-cover" />
            </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{topic.title}</CardTitle>
            <CardDescription>{topic.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {!canVote && (
                 <div className="space-y-4">
                    <h3 className="font-semibold">Hasil Voting</h3>
                     <VotingResultDisplay topic={topic} />
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{hasVoted ? 'Anda Sudah Memilih' : 'Voting Telah Berakhir'}</AlertTitle>
                        <AlertDescription>
                            {hasVoted ? 'Terima kasih telah berpartisipasi.' : `Voting untuk topik ini telah berakhir pada ${format(new Date(topic.endDate), 'dd MMMM yyyy')}.`}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {canVote && (
              <div className="space-y-4">
                <h3 className="font-semibold">Pilih Opsi Anda:</h3>
                <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''}>
                  {topic.options.map(opt => (
                    <Label key={opt.id} className="flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                        {opt.imageUrl ? (
                           <Image src={opt.imageUrl} alt={opt.name} width={40} height={40} className="rounded-full w-10 h-10 object-cover" />
                        ) : (
                           <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                        <span className="flex-1">{opt.name}</span>
                        <RadioGroupItem value={opt.id} />
                    </Label>
                  ))}
                </RadioGroup>
                <Button className="w-full" onClick={handleVote} disabled={!selectedOption || submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  {submitting ? 'Mengirim...' : 'Kirim Suara'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
