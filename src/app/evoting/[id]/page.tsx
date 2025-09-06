
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getVotingTopic, castVote, VotingTopicDTO } from '@/app/actions/voting';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Check, Info } from 'lucide-react';
import { format } from 'date-fns';

const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Opsi
            </span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Suara
            </span>
            <span className="font-bold">{payload[0].value}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
      // Re-fetch data to show updated results
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
  
  const isVotingActive = topic && new Date() >= new Date(topic.startDate) && new Date() <= new Date(topic.endDate);
  const chartData = topic.options.map(opt => ({ name: opt.name, total: opt.voteCount }));

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{topic.title}</CardTitle>
            <CardDescription>{topic.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasVoted || !isVotingActive ? (
                <div className="space-y-4">
                    <h3 className="font-semibold">Hasil Voting</h3>
                    {topic.totalVotes > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Belum ada suara yang masuk.</p>
                    )}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{hasVoted ? 'Anda Sudah Memilih' : 'Voting Telah Berakhir'}</AlertTitle>
                        <AlertDescription>
                            {hasVoted ? 'Terima kasih telah berpartisipasi.' : `Voting untuk topik ini telah berakhir pada ${format(new Date(topic.endDate), 'dd MMMM yyyy')}.`}
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Pilih Opsi Anda:</h3>
                <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''}>
                  {topic.options.map(opt => (
                    <Label key={opt.id} className="flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <RadioGroupItem value={opt.id} />
                      {opt.name}
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
