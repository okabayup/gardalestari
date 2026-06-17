
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { markAttendance, getEvent, Event, markGuestAttendance } from '@/app/actions/events';
import { Loader2, CheckCircle, XCircle, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type View = 'options' | 'guest_form' | 'processing' | 'result';
type ResultStatus = 'success' | 'error';

export default function EventAbsenPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [view, setView] = useState<View>('processing');
  const [resultStatus, setResultStatus] = useState<ResultStatus | null>(null);
  const [message, setMessage] = useState('Memuat data acara...');

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const fetchEventData = useCallback(async () => {
    try {
      const fetchedEvent = await getEvent(eventId);
      if (!fetchedEvent) {
        throw new Error('Acara tidak ditemukan.');
      }
      setEvent(fetchedEvent);
      if (fetchedEvent.visibility === 'public') {
        setView('options');
      } else {
        // If members-only, proceed directly to member attendance
        handleMemberAttendance();
      }
    } catch (error) {
      setMessage((error as Error).message);
      setResultStatus('error');
      setView('result');
    }
  }, [eventId]);

  const handleMemberAttendance = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      router.push(`/login?redirect=/events/${eventId}/absen`);
      return;
    }

    setView('processing');
    setMessage('Mencatat kehadiran Anda...');
    try {
      const result = await markAttendance(eventId, user.uid, user.displayName || 'Anggota');
      if (result.success) {
        setResultStatus('success');
        setMessage(result.message);
        toast({ title: 'Berhasil!', description: result.message });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setResultStatus('error');
      setMessage((error as Error).message);
      toast({ variant: 'destructive', title: 'Gagal', description: (error as Error).message });
    } finally {
      setView('result');
    }
  }, [authLoading, user, eventId, router, toast]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  useEffect(() => {
    if (event && event.visibility === 'member') {
      handleMemberAttendance();
    }
  }, [event, handleMemberAttendance]);
  
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) {
        toast({ variant: 'destructive', title: 'Data tidak lengkap', description: 'Nama dan email wajib diisi.' });
        return;
    }
    setView('processing');
    setMessage('Menyimpan data kehadiran...');
    try {
        await markGuestAttendance(eventId, { name: guestName, email: guestEmail, phone: guestPhone });
        setResultStatus('success');
        setMessage('Terima kasih! Kehadiran Anda telah berhasil dicatat.');
        toast({ title: 'Kehadiran Berhasil Dicatat!' });
    } catch (error) {
        setResultStatus('error');
        setMessage((error as Error).message);
        toast({ variant: 'destructive', title: 'Gagal Mencatat Kehadiran', description: (error as Error).message });
    } finally {
        setView('result');
    }
  }

  const renderContent = () => {
    switch (view) {
      case 'options':
        return (
          <div className="space-y-4">
            <Button size="lg" className="w-full" onClick={handleMemberAttendance}>
              <User className="mr-2 h-5 w-5" /> Saya Anggota Terdaftar
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => setView('guest_form')}>
              <Users className="mr-2 h-5 w-5" /> Saya Pengunjung Eksternal
            </Button>
          </div>
        );
      case 'guest_form':
        return (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="guest-name">Nama Lengkap</Label>
                    <Input id="guest-name" value={guestName} onChange={e => setGuestName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="guest-email">Alamat Email</Label>
                    <Input id="guest-email" type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="guest-phone">Nomor Telepon (Opsional)</Label>
                    <Input id="guest-phone" type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Konfirmasi Kehadiran</Button>
                 <Button variant="link" className="w-full" onClick={() => setView('options')}>Kembali</Button>
            </form>
        )
      case 'processing':
        return (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-semibold">{message}</p>
          </div>
        );
      case 'result':
        const Icon = resultStatus === 'success' ? CheckCircle : XCircle;
        const iconColor = resultStatus === 'success' ? 'text-green-500' : 'text-destructive';
        return (
          <div className="flex flex-col items-center gap-4">
            <Icon className={`h-12 w-12 ${iconColor}`} />
            <p className="font-semibold">{message}</p>
            <Button asChild className="w-full">
              <Link href={`/events/${eventId}`}>Kembali ke Detail Acara</Link>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Absensi Acara</CardTitle>
          <CardDescription>{event?.title || 'Memuat...'}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
