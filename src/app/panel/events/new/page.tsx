
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, Wand2, Paperclip } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createEvent } from '@/app/actions/events';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  imageHint: z.string().min(1, 'Petunjuk gambar wajib diisi'),
  attachment: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      imageUrl: '',
      imageHint: '',
    },
  });

  const attachmentFile = watch("attachment");
  const attachmentFileName = attachmentFile?.[0]?.name;


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { attachment, ...eventData } = data;
      const eventPayload = {
        ...eventData,
        date: Timestamp.fromDate(data.date),
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title.replace(/\s+/g, '-')}/600/400`
      };
      await createEvent(eventPayload, attachment?.[0]);
      toast({ title: 'Acara berhasil dibuat!' });
      router.push('/panel/events');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat acara', description: (error as Error).message });
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
      const imageHint = getValues('imageHint');
      if (!imageHint.trim()) {
          toast({ variant: 'destructive', title: 'Petunjuk gambar kosong' });
          return;
      }
      setLoadingImage(true);
      try {
          const result = await generateImage({ prompt: imageHint });
          if (result.imageUrl) {
              setValue('imageUrl', result.imageUrl);
              toast({ title: 'Gambar berhasil dibuat!' });
          } else {
              throw new Error("AI tidak mengembalikan URL gambar.");
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal membuat gambar', description: (error as Error).message });
      } finally {
          setLoadingImage(false);
      }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Acara Baru</h1>
          <p className="text-muted-foreground">Isi detail di bawah ini untuk menambahkan acara baru.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/events')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Acara
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Acara</CardTitle>
            <CardDescription>Informasi utama mengenai acara yang akan diselenggarakan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Acara</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Acara</Label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input id="location" {...register('location')} />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
          </div>
           <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar (untuk AI)</Label>
                <div className="flex gap-2">
                    <Input id="imageHint" {...register('imageHint')} />
                    <Button type="button" onClick={handleGenerateImage} disabled={loadingImage} className="whitespace-nowrap">
                        {loadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                        Buat
                    </Button>
                </div>
                 {errors.imageHint && <p className="text-sm text-destructive">{errors.imageHint.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar</Label>
                <Input id="imageUrl" {...register('imageUrl')} placeholder="Generate dengan AI atau tempel URL di sini" />
                {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="attachment">Berkas Lampiran (Opsional)</Label>
                <Input id="attachment" type="file" {...register('attachment')} />
                {attachmentFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {attachmentFileName}</p>}
                {errors.attachment && <p className="text-sm text-destructive">{(errors.attachment as any).message}</p>}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
