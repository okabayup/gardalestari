
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { markAttendance } from '@/app/actions/events';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EventAbsenPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Mencatat kehadiran Anda...');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login but keep the event ID to return after
      router.push(`/login?redirect=/events/${eventId}/absen`);
      return;
    }

    const recordAttendance = async () => {
      try {
        const result = await markAttendance(eventId, user.uid, user.displayName || 'Anggota');
        if (result.success) {
          setStatus('success');
          setMessage(result.message);
          toast({ title: 'Berhasil!', description: result.message });
        } else {
          setStatus('error');
          setMessage(result.message);
          toast({ variant: 'destructive', title: 'Gagal', description: result.message });
        }
      } catch (error) {
        setStatus('error');
        const errorMessage = (error as Error).message;
        setMessage(errorMessage);
        toast({ variant: 'destructive', title: 'Terjadi Kesalahan', description: errorMessage });
      }
    };

    recordAttendance();
  }, [eventId, user, authLoading, router, toast]);

  const StatusIcon = {
    loading: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
    success: <CheckCircle className="h-12 w-12 text-green-500" />,
    error: <XCircle className="h-12 w-12 text-destructive" />,
  }[status];

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Absensi Acara</CardTitle>
          <CardDescription>Status pencatatan kehadiran Anda.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {StatusIcon}
          <p className="font-semibold">{message}</p>
          {(status === 'success' || status === 'error') && (
            <Button asChild className="w-full">
              <Link href={`/events/${eventId}`}>Kembali ke Detail Acara</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
