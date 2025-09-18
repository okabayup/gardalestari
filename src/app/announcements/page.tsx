
'use server';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAnnouncements, Announcement } from '@/app/actions/announcements';
import { Megaphone, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const AnnouncementItem = ({ announcement }: { announcement: Announcement }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{announcement.title}</CardTitle>
        <CardDescription>
          Dipublikasikan pada {format(new Date(announcement.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
          {announcement.content}
        </p>
        {announcement.attachmentUrl && (
          <Button asChild variant="outline" size="sm">
            <Link href={announcement.attachmentUrl} target="_blank">
              <Paperclip className="mr-2 h-4 w-4" />
              {announcement.attachmentName || 'Lihat Lampiran'}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-3xl font-bold">Pengumuman</h1>
          <p className="text-muted-foreground">Informasi penting dan pembaruan dari organisasi.</p>
        </div>
          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((item) => (
                <AnnouncementItem key={item.id} announcement={item} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Megaphone className="h-10 w-10" />
                  <span>Belum ada pengumuman yang dipublikasikan.</span>
                </div>
              </div>
            )}
          </div>
      </div>
    </MainLayout>
  );
}
