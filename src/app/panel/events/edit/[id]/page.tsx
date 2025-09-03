
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, Wand2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { getEvent, updateEvent } from '@/app/actions/events';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  imageHint: z.string().min(1, 'Petunjuk gambar wajib diisi'),
});

type FormData = z.infer<typeof formSchema>;

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setPageLoading(true);
        try {
          const event = await getEvent(eventId);
          if (event) {
            reset({
              ...event,
              date: event.date.toDate(),
            });
          } else {
            toast({ variant: 'destructive', title: 'Acara tidak ditemukan' });
            router.push('/panel/events');
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal memuat acara' });
        } finally {
          setPageLoading(false);
        }
      };
      fetchEvent();
    }
  }, [eventId, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const eventPayload = {
        ...data,
        date: Timestamp.fromDate(data.date),
      };
      await updateEvent(eventId, eventPayload);
      toast({ title: 'Acara berhasil diperbarui!' });
      router.push('/panel/events');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui acara', description: (error as Error).message });
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
  
  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Edit Acara</h1>
          <p className="text-muted-foreground">Perbarui detail acara di bawah ini.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/events')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Acara</CardTitle>
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
        </CardContent>
      </Card>
    </form>
  );
}
