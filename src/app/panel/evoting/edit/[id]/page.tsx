
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, PlusCircle, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { getVotingTopic, updateVotingTopic, VotingTopicDTO, UpdateVotingTopicPayload } from '@/app/actions/voting';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  dateRange: z.object({
    from: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
    to: z.date({ required_error: 'Tanggal selesai wajib diisi' }),
  }),
  options: z.array(z.object({ 
      id: z.string(), 
      name: z.string().min(1, 'Nama opsi tidak boleh kosong'),
      voteCount: z.number(),
    })).min(2, 'Minimal harus ada dua opsi'),
});

type FormData = z.infer<typeof formSchema>;

export default function EditEVotingPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });
  
   useEffect(() => {
    if (topicId) {
      const fetchTopic = async () => {
        setPageLoading(true);
        try {
          const topic = await getVotingTopic(topicId);
          if (topic) {
            reset({
              ...topic,
              dateRange: { from: new Date(topic.startDate), to: new Date(topic.endDate) },
            });
          } else {
            toast({ variant: 'destructive', title: 'Topik tidak ditemukan' });
            router.push('/panel/evoting');
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal memuat topik' });
        } finally {
          setPageLoading(false);
        }
      };
      fetchTopic();
    }
  }, [topicId, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: UpdateVotingTopicPayload = {
        title: data.title,
        description: data.description,
        startDate: data.dateRange.from,
        endDate: data.dateRange.to,
        options: data.options,
      };

      await updateVotingTopic(topicId, payload);
      toast({ title: 'Topik E-Voting berhasil diperbarui!' });
      router.push('/panel/evoting');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui topik', description: (error as Error).message });
    } finally {
        setLoading(false);
    }
  };
  
  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Edit Topik E-Voting</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/evoting')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Topik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Voting</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Periode Voting</Label>
            <Controller name="dateRange" control={control} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pilih rentang tanggal</span>)}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={field.value.from} selected={field.value} onSelect={field.onChange} numberOfMonths={1} />
                    </PopoverContent>
                </Popover>
            )} />
            {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.from?.message || errors.dateRange.to?.message}</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Opsi Voting</CardTitle>
            <CardDescription>Tambahkan kandidat atau pilihan yang bisa divoting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                    <Input {...register(`options.${index}.name`)} placeholder={`Opsi ${index + 1}`} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
             {errors.options && <p className="text-sm text-destructive">{errors.options.root?.message || errors.options?.[0]?.name?.message}</p>}

            <Button type="button" variant="outline" onClick={() => append({ id: `option-${Date.now()}`, name: '', voteCount: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Opsi
            </Button>
        </CardContent>
      </Card>
    </form>
  );
}
