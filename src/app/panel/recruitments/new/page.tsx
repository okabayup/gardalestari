
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { createRecruitment } from '@/app/actions/recruitments';
import { getPartners, Partner } from '@/app/actions/partners';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  type: z.enum(['internal', 'external'], { required_error: 'Tipe rekrutmen wajib dipilih' }),
  partnerId: z.string().optional(),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  requirements: z.string().min(1, 'Persyaratan wajib diisi'),
  applicationUrl: z.string().url('URL pendaftaran tidak valid'),
  deadline: z.date({ required_error: 'Batas waktu wajib diisi' }),
}).refine(data => data.type !== 'external' || !!data.partnerId, {
  message: "Mitra harus dipilih untuk rekrutmen eksternal",
  path: ["partnerId"],
});

type FormData = z.infer<typeof formSchema>;

export default function NewRecruitmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'internal' },
  });

  const type = watch('type');

  useEffect(() => {
    if (type === 'external') {
      getPartners().then(setPartners);
    }
  }, [type]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createRecruitment(data);
      toast({ title: 'Rekrutmen berhasil dibuat!' });
      router.push('/panel/recruitments');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat rekrutmen', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Lowongan Rekrutmen</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/recruitments')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Lowongan
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Lowongan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Posisi yang Dibuka</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipe Rekrutmen</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                  <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="internal" /> Internal (Garda Lestari)</Label>
                  <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="external" /> Eksternal (Mitra)</Label>
                </RadioGroup>
              )}
            />
          </div>

          {type === 'external' && (
            <div className="space-y-2">
              <Label htmlFor="partnerId">Pilih Mitra</Label>
              <Controller
                name="partnerId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih mitra penyelenggara" /></SelectTrigger>
                    <SelectContent>
                      {partners.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.partnerId && <p className="text-sm text-destructive">{errors.partnerId.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Pekerjaan</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Persyaratan (satu per baris)</Label>
            <Textarea id="requirements" {...register('requirements')} placeholder="- Pengalaman minimal 1 tahun&#10;- Mampu bekerja dalam tim" />
            {errors.requirements && <p className="text-sm text-destructive">{errors.requirements.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationUrl">URL Pendaftaran</Label>
            <Input id="applicationUrl" type="url" {...register('applicationUrl')} placeholder="https://..." />
            {errors.applicationUrl && <p className="text-sm text-destructive">{errors.applicationUrl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Batas Waktu Pendaftaran</Label>
            <Controller
              name="deadline"
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
            {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
