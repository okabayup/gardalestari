
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock, RefreshCw, XCircle, ArrowLeft } from 'lucide-react';
import { getJobStatus, retryFailedTopics, GenerationJob } from '@/app/actions/berita';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const JobStatusIcon = ({ status }: { status: GenerationJob['status'] }) => {
  switch (status) {
    case 'in-progress':
    case 'pending':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};


export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobStatus = useCallback(async () => {
    try {
      const fetchedJob = await getJobStatus(jobId);
      setJob(fetchedJob);
      if (fetchedJob?.status === 'completed' || fetchedJob?.status === 'failed') {
          return true; // Stop polling
      }
      return false; // Continue polling
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat status tugas' });
      return true; // Stop polling on error
    } finally {
      setLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    const startPolling = async () => {
        const shouldStop = await fetchJobStatus();
        if (shouldStop) {
            if (intervalId) clearInterval(intervalId);
            return;
        }

        intervalId = setInterval(async () => {
            const stopped = await fetchJobStatus();
            if (stopped && intervalId) {
                clearInterval(intervalId);
            }
        }, 5000); // Poll every 5 seconds
    };

    startPolling();

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, [fetchJobStatus]);

  const handleRetry = async () => {
    if (!job) return;
    try {
      const newJobId = await retryFailedTopics(job);
      toast({ title: 'Tugas baru dibuat!', description: `Mencoba ulang topik yang gagal dengan ID tugas: ${newJobId}`});
      router.push(`/panel/berita/jobs/${newJobId}`);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Gagal mencoba ulang', description: (error as Error).message });
    }
  }

  if (loading) {
     return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
     );
  }

  if (!job) {
    return (
        <div className="text-center py-20 text-muted-foreground">
            <p>Tugas tidak ditemukan.</p>
             <Button variant="link" onClick={() => router.push('/panel/berita/jobs')}>Kembali ke Riwayat Tugas</Button>
        </div>
    )
  }

  const progress = job.totalCount > 0 ? (job.completedCount / job.totalCount) * 100 : 0;
  const hasErrors = job.errors.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/panel/berita/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Riwayat Tugas
        </Button>
         {(job.status === 'failed' || (job.status === 'completed' && hasErrors)) && (
            <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi Topik yang Gagal ({job.errors.length})
            </Button>
        )}
      </div>

       <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-mono flex items-center gap-2">
                <JobStatusIcon status={job.status} />
                Tugas #{job.id?.substring(0, 8)}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                Dibuat pada {format(new Date(job.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                 {job.completedAt && ` | Selesai pada ${format(new Date(job.completedAt), 'HH:mm', { locale: id })}`}
                </CardDescription>
            </div>
            <Badge variant={
                job.status === 'completed' ? 'default' : 
                job.status === 'failed' ? 'destructive' : 'secondary'
            }>
                {job.status}
            </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span>Progres</span>
                    <span>{job.completedCount} dari {job.totalCount} artikel selesai</span>
                </div>
                <Progress value={progress} />
            </div>
            {hasErrors && (
            <Accordion type="single" collapsible defaultValue="errors">
                <AccordionItem value="errors">
                <AccordionTrigger className="text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Ditemukan {job.errors.length} Kegagalan
                </AccordionTrigger>
                <AccordionContent className="bg-muted/50 p-4 rounded-md">
                    <ul className="text-sm space-y-4 max-h-60 overflow-y-auto">
                        {job.errors.map((err, index) => (
                            <li key={index}>
                                <p className="font-semibold">{err.topic}</p>
                                <p className="text-xs text-muted-foreground">{err.error}</p>
                            </li>
                        ))}
                    </ul>
                </AccordionContent>
                </AccordionItem>
            </Accordion>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
