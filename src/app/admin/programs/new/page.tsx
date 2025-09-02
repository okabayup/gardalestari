
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { createProgram, Program, ProgramTag, getProgramTags } from '@/app/actions/programs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

type FormData = Omit<Program, 'id' | 'startDate' | 'endDate'> & {
  dateRange: DateRange | undefined;
};

export default function NewProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<ProgramTag[]>([]);
  const { register, handleSubmit, control, watch } = useForm<FormData>({
    defaultValues: {
      tags: [],
    }
  });

  const selectedTags = watch('tags');

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getProgramTags();
      setAvailableTags(tags);
    };
    fetchTags();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!data.dateRange?.from || !data.dateRange?.to) {
        toast({ variant: 'destructive', title: 'Rentang Tanggal Diperlukan' });
        return;
    }
    if (data.tags.length === 0) {
        toast({ variant: 'destructive', title: 'Tag Diperlukan', description: 'Pilih setidaknya satu tag.' });
        return;
    }
    setLoading(true);
    try {
        const newProgram: Omit<Program, 'id'> = {
            title: data.title,
            description: data.description,
            category: data.category,
            tags: data.tags,
            startDate: Timestamp.fromDate(data.dateRange.from),
            endDate: Timestamp.fromDate(data.dateRange.to),
            imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title.replace(/\s+/g, '-')}/600/400`,
            imageHint: data.imageHint || 'program activity',
        };
        await createProgram(newProgram);
        toast({
            title: 'Program Dibuat!',
            description: 'Program baru telah berhasil disimpan.',
        });
        router.push('/admin/programs');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menyimpan',
            description: (error as Error).message || 'Terjadi kesalahan saat menyimpan program.',
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
            <CardTitle>Buat Program Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk membuat program kerja baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Nama Program</Label>
                <Input id="title" placeholder="Nama program yang jelas..." {...register('title', { required: true })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Controller
                    name="category"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flagship">Program Unggulan (Flagship)</SelectItem>
                                <SelectItem value="ongoing">Inisiatif Berkelanjutan (Ongoing)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dateRange">Rentang Waktu Program</Label>
                    <Controller
                        name="dateRange"
                        control={control}
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (
                                    field.value.to ? (
                                        <>
                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                        {format(field.value.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(field.value.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pilih rentang tanggal</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={field.value?.from}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                </div>
              </div>

               <div className="space-y-2">
                    <Label>Tags</Label>
                    <Card className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableTags.map(tag => (
                            <Controller
                                key={tag.id}
                                name="tags"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={tag.id}
                                            checked={field.value?.includes(tag.name)}
                                            onCheckedChange={(checked) => {
                                                const currentTags = field.value || [];
                                                return checked
                                                ? field.onChange([...currentTags, tag.name])
                                                : field.onChange(currentTags.filter(value => value !== tag.name))
                                            }}
                                        />
                                        <Label htmlFor={tag.id} className="font-normal">{tag.name}</Label>
                                    </div>
                                )}
                            />
                        ))}
                        </div>
                    </Card>
                </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar (Opsional)</Label>
                <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
                 <p className="text-xs text-muted-foreground">Jika dikosongkan, gambar placeholder akan digunakan.</p>
              </div>

               <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar untuk AI (Opsional)</Label>
                <Input id="imageHint" placeholder="Contoh: youth planting trees" {...register('imageHint')} />
                 <p className="text-xs text-muted-foreground">Maksimal 2 kata. Digunakan jika URL gambar tidak diisi.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" placeholder="Jelaskan secara singkat tentang program ini..." rows={5} {...register('description', { required: true })}/>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/programs')}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Program
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
