
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { getEvent, updateEvent, Event as EventType } from '@/app/actions/events';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


type FormData = Omit<EventType, 'id' | 'date'> & { date: Date };

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { register, handleSubmit, reset, control } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setPageLoading(true);
      const fetchedEvent = await getEvent(id as string);
      if (!fetchedEvent) {
        notFound();
      } else {
        reset({
          ...fetchedEvent,
          date: fetchedEvent.date.toDate(), // Convert Firestore Timestamp to JS Date
        });
      }
      setPageLoading(false);
    };
    fetchEvent();
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setLoading(true);
    
    try {
      const eventToUpdate: Partial<EventType> = {
        ...data,
        date: Timestamp.fromDate(data.date), // Convert JS Date back to Timestamp
      };
      await updateEvent(id as string, eventToUpdate);
      toast({
        title: 'Acara Diperbarui!',
        description: 'Perubahan pada acara telah disimpan.',
      });
      router.push('/admin/events');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Acara</CardTitle>
            <CardDescription>Perbarui detail acara di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Nama Acara</Label>
                    <Input id="title" {...register('title', { required: true })} />
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
                        <Input id="location" {...register('location', { required: true })} />
                    </div>
                </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar</Label>
                <Input id="imageUrl" {...register('imageUrl')} />
              </div>

               <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar untuk AI</Label>
                <Input id="imageHint" {...register('imageHint')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" rows={5} {...register('description', { required: true })}/>
              </div>

               <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/events')}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
