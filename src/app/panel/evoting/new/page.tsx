
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, PlusCircle, X, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { createVotingTopic } from '@/app/actions/voting';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  dateRange: z.object({
    from: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
    to: z.date({ required_error: 'Tanggal selesai wajib diisi' }),
  }),
  coverImageFile: z.any().optional(),
  options: z.array(z.object({ 
      name: z.string().min(1, 'Nama opsi tidak boleh kosong'),
      imageFile: z.any().optional(),
    })).min(2, 'Minimal harus ada dua opsi'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewEVotingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dateRange: { from: new Date(), to: addDays(new Date(), 7) },
      options: [{ name: '' }, { name: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const watchCoverFile = watch('coverImageFile');
  useEffect(() => {
    if (watchCoverFile && watchCoverFile[0]) {
        setCoverPreview(URL.createObjectURL(watchCoverFile[0]));
    }
  }, [watchCoverFile]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const optionsPayload = data.options.map(opt => ({
          name: opt.name,
          imageFile: opt.imageFile?.[0]
      }));

      await createVotingTopic(
        { 
            title: data.title, 
            description: data.description, 
            startDate: data.dateRange.from, 
            endDate: data.dateRange.to
        }, 
        optionsPayload, 
        data.coverImageFile?.[0]
      );
      toast({ title: 'Topik E-Voting berhasil dibuat!' });
      router.push('/panel/evoting');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat topik', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Topik E-Voting Baru</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/evoting')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Topik
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
           <div className="space-y-2">
                <Label htmlFor="coverImageFile">Gambar Sampul (Opsional)</Label>
                {coverPreview && <Image src={coverPreview} alt="Cover preview" width={200} height={100} className="rounded-md object-cover border" />}
                <Input id="coverImageFile" type="file" {...register('coverImageFile')} accept="image/*" />
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
                <div key={field.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label>Nama Opsi</Label>
                        <Input {...register(`options.${index}.name`)} placeholder={`Opsi ${index + 1}`} />
                    </div>
                     <div className="w-full sm:w-64 space-y-2">
                        <Label>Gambar Opsi (Opsional)</Label>
                        <Input type="file" {...register(`options.${index}.imageFile`)} accept="image/*" />
                    </div>
                     <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2} className="mt-6">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            {errors.options && <p className="text-sm text-destructive">{errors.options.root?.message || (errors.options as any)?.[0]?.name?.message}</p>}

            <Button type="button" variant="outline" onClick={() => append({ name: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Opsi
            </Button>
        </CardContent>
      </Card>
    </form>
  );
}
