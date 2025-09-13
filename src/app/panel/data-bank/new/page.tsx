'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createDataBankEntry } from '@/app/actions/bank-data';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/panel/RichTextEditor';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  summary: z.string().min(1, 'Ringkasan wajib diisi'),
  content: z.string().min(1, 'Konten wajib diisi'),
  category: z.enum(['Kebijakan', 'Data Sektoral', 'Riset', 'Lainnya'], { required_error: 'Kategori wajib dipilih' }),
  source: z.string().min(1, 'Sumber wajib diisi'),
  publishedDate: z.date({ required_error: 'Tanggal terbit wajib diisi' }),
});

type FormData = z.infer<typeof formSchema>;

export default function NewDataBankEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        publishedDate: Timestamp.fromDate(data.publishedDate),
      };
      await createDataBankEntry(payload);
      toast({ title: 'Entri data berhasil ditambahkan!' });
      router.push('/panel/data-bank');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Tambah Entri Bank Data</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/data-bank')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Entri
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Entri Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Ringkasan</Label>
            <Textarea id="summary" {...register('summary')} placeholder="Ringkasan singkat yang akan dilihat oleh AI..." />
            {errors.summary && <p className="text-sm text-destructive">{errors.summary.message}</p>}
          </div>
          
           <div className="space-y-2">
            <Label>Konten Lengkap</Label>
            <Controller
                name="content"
                control={control}
                render={({ field }) => (
                    <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                    />
                )}
            />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>Kategori</Label>
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Kebijakan">Kebijakan</SelectItem>
                                <SelectItem value="Data Sektoral">Data Sektoral</SelectItem>
                                <SelectItem value="Riset">Riset</SelectItem>
                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Sumber</Label>
              <Input id="source" {...register('source')} placeholder="e.g., BPS, Kemenko Marves"/>
              {errors.source && <p className="text-sm text-destructive">{errors.source.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>Tanggal Publikasi Sumber</Label>
                <Controller
                name="publishedDate"
                control={control}
                render={({ field }) => (
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                    </Popover>
                )}
                />
                {errors.publishedDate && <p className="text-sm text-destructive">{errors.publishedDate.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
