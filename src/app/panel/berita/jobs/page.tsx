
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock, RefreshCw, XCircle } from 'lucide-react';
import { getGenerationJobs, retryFailedTopics, GenerationJob } from '@/app/actions/berita';
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

const JobCard = ({ job, onRetry }: { job: GenerationJob; onRetry: (job: GenerationJob) => void }) => {
  const progress = job.totalCount > 0 ? (job.completedCount / job.totalCount) * 100 : 0;
  const hasErrors = job.errors.length > 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <JobStatusIcon status={job.status} />
              Tugas #{job.id?.substring(0, 8)}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Dibuat pada {format(new Date(job.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
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
                <span>{job.completedCount} / {job.totalCount} Selesai</span>
            </div>
            <Progress value={progress} />
        </div>
        {hasErrors && (
          <Accordion type="single" collapsible>
            <AccordionItem value="errors">
              <AccordionTrigger className="text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                Ditemukan {job.errors.length} Kegagalan
              </AccordionTrigger>
              <AccordionContent className="bg-muted/50 p-2 rounded-md">
                <ul className="text-xs space-y-2">
                    {job.errors.map((err, index) => (
                        <li key={index}>
                            <p className="font-semibold">{err.topic}</p>
                            <p className="text-muted-foreground">{err.error}</p>
                        </li>
                    ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      {job.status === 'failed' || (job.status === 'completed' && hasErrors) ? (
        <div className="p-4 border-t">
          <Button size="sm" onClick={() => onRetry(job)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi Topik yang Gagal ({job.errors.length})
          </Button>
        </div>
      ) : null}
    </Card>
  );
};

export default function AIJobsHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedJobs = await getGenerationJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat riwayat tugas' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleRetry = async (job: GenerationJob) => {
    try {
      const newJobId = await retryFailedTopics(job);
      toast({ title: 'Tugas baru dibuat!', description: `Mencoba ulang topik yang gagal dengan ID tugas: ${newJobId}`});
      fetchJobs();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Gagal mencoba ulang', description: (error as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Riwayat Tugas Agen AI</h1>
          <p className="text-muted-foreground">Pantau semua tugas yang dijalankan oleh agen pembuatan konten AI.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/panel/berita')}>
          Kembali ke Daftar Konten
        </Button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onRetry={handleRetry} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Belum ada tugas agen AI yang dijalankan.</p>
        </div>
      )}
    </div>
  );
}
