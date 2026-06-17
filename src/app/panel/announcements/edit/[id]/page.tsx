
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Paperclip } from 'lucide-react';
import { getAnnouncement, updateAnnouncement } from '@/app/actions/announcements';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  content: z.string().min(1, 'Konten wajib diisi'),
  attachment: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentAttachment, setCurrentAttachment] = useState<{name: string, url: string} | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const attachmentFile = watch("attachment");
  const attachmentFileName = attachmentFile?.[0]?.name;

  useEffect(() => {
    if (id) {
      const fetchAnnouncement = async () => {
        setPageLoading(true);
        try {
          const data = await getAnnouncement(id);
          if (data) {
            reset(data);
            if (data.attachmentUrl && data.attachmentName) {
              setCurrentAttachment({name: data.attachmentName, url: data.attachmentUrl});
            }
          } else {
            toast({ variant: 'destructive', title: 'Pengumuman tidak ditemukan' });
            router.push('/panel/announcements');
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal memuat pengumuman' });
        } finally {
          setPageLoading(false);
        }
      };
      fetchAnnouncement();
    }
  }, [id, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { attachment, ...announcementData } = data;
      await updateAnnouncement(id, announcementData, attachment?.[0]);
      toast({ title: 'Pengumuman berhasil diperbarui!' });
      router.push('/panel/announcements');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui', description: (error as Error).message });
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Edit Pengumuman</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/announcements')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Pengumuman</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Isi Pengumuman</Label>
            <Textarea id="content" {...register('content')} rows={10} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Lampiran (kosongkan jika tidak ingin mengubah)</Label>
            <Input id="attachment" type="file" {...register('attachment')} />
             {attachmentFileName ? (
               <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {attachmentFileName}</p>
             ) : currentAttachment ? (
               <p className="text-sm text-muted-foreground flex items-center gap-2">
                 <Paperclip className="h-4 w-4"/> 
                 <Link href={currentAttachment.url} target="_blank" className="hover:underline text-primary">{currentAttachment.name}</Link>
               </p>
             ) : null}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
