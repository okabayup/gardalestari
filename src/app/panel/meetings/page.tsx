
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMeetings, Booking } from '@/app/actions/booking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function MeetingsPage() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat permintaan meeting' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Permintaan Meeting</h1>
        <p className="text-muted-foreground">Tinjau dan kelola semua permintaan meeting yang masuk.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan</CardTitle>
          <CardDescription>Total {meetings.length} permintaan ditemukan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Topik</TableHead>
                <TableHead>Jadwal Diajukan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : meetings.length > 0 ? (
                meetings.map(meeting => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.customerName}</TableCell>
                    <TableCell>
                        <p>{meeting.customerEmail}</p>
                        <p className="text-sm text-muted-foreground">{meeting.customerPhone}</p>
                    </TableCell>
                    <TableCell>{meeting.meetingTopic}</TableCell>
                    <TableCell>{format(new Date(meeting.bookingDate as unknown as string), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</TableCell>
                    <TableCell>
                        <Badge variant={meeting.status === 'pending' ? 'secondary' : 'default'}>
                            {meeting.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Belum ada permintaan meeting.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
