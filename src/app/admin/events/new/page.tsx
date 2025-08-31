
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { createEvent, Event } from '@/app/actions/events';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type FormData = Omit<Event, 'id' | 'date'> & { date: Date };

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, control } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const newEvent: Omit<Event, 'id'> = {
            title: data.title,
            description: data.description,
            date: Timestamp.fromDate(data.date),
            location: data.location,
            imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title.replace(/\s+/g, '-')}/600/400`,
            imageHint: data.imageHint || 'event photo',
        };
        await createEvent(newEvent);
        toast({
            title: 'Acara Dibuat!',
            description: 'Acara baru telah berhasil disimpan.',
        });
        router.push('/admin/events');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menyimpan',
            description: (error as Error).message || 'Terjadi kesalahan saat menyimpan acara.',
        });
        setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Buat Acara Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk membuat acara baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Nama Acara</Label>
                <Input id="title" placeholder="Nama acara..." {...register('title', { required: true })} />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="date">Tanggal Acara</Label>
                    <Controller
                        name="date"
                        control={control}
                        rules={{ required: true }}
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
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location">Lokasi</Label>
                    <Input id="location" placeholder="cth. Online / Bogor" {...register('location', { required: true })} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar (Opsional)</Label>
                <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
                 <p className="text-xs text-muted-foreground">Jika dikosongkan, gambar placeholder akan digunakan.</p>
              </div>

               <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar untuk AI (Opsional)</Label>
                <Input id="imageHint" placeholder="Contoh: people planting trees" {...register('imageHint')} />
                 <p className="text-xs text-muted-foreground">Maksimal 2 kata. Digunakan jika URL gambar tidak diisi.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" placeholder="Jelaskan secara singkat tentang acara ini..." rows={5} {...register('description', { required: true })}/>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/events')}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Acara
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
