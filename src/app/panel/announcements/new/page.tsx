
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { createAnnouncement } from '@/app/actions/announcements';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  content: z.string().min(1, 'Konten wajib diisi'),
  attachment: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const attachmentFile = watch("attachment");
  const attachmentFileName = attachmentFile?.[0]?.name;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { attachment, ...announcementData } = data;
      await createAnnouncement(announcementData, attachment?.[0]);
      toast({ title: 'Pengumuman berhasil dibuat!' });
      router.push('/panel/announcements');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat pengumuman', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Pengumuman Baru</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/announcements')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengumuman
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Pengumuman</CardTitle>
        </CardHeader>
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
            <Label htmlFor="attachment">Lampiran (Opsional)</Label>
            <Input id="attachment" type="file" {...register('attachment')} />
            {attachmentFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {attachmentFileName}</p>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
