
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
import { Loader2, Calendar as CalendarIcon, Wand2, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { addDays, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createProgram, getProgramTags, ProgramTag } from '@/app/actions/programs';
import { getPartners, Partner } from '@/app/actions/partners';
import { getForms, ProgramForm } from '@/app/actions/forms';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { cn } from '@/lib/utils';
import { DateRange } from "react-day-picker";

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  category: z.enum(['flagship', 'ongoing'], { required_error: 'Kategori program wajib dipilih' }),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  imageHint: z.string().min(1, 'Petunjuk gambar wajib diisi'),
  tags: z.array(z.string()).min(1, 'Minimal satu tag harus dipilih'),
  dateRange: z.object({
    from: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
    to: z.date({ required_error: 'Tanggal selesai wajib diisi' }),
  }),
  source: z.enum(['garda_lestari', 'mitra'], { required_error: 'Sumber program wajib dipilih' }),
  partnerId: z.string().optional(),
  benefits: z.string().min(1, 'Benefit wajib diisi'),
  requiredDocuments: z.string().min(1, 'Dokumen wajib diisi'),
  submissionType: z.enum(['internal', 'external'], { required_error: 'Tipe pendaftaran wajib dipilih' }),
  applicationUrl: z.string().optional(),
  formId: z.string().optional(),
  requiresRecommendation: z.boolean().default(false),
}).refine(data => data.source !== 'mitra' || !!data.partnerId, {
    message: "Mitra harus dipilih jika sumbernya adalah mitra",
    path: ["partnerId"],
}).refine(data => data.submissionType !== 'external' || (!!data.applicationUrl && z.string().url().safeParse(data.applicationUrl).success), {
    message: "URL pendaftaran eksternal harus valid",
    path: ["applicationUrl"],
}).refine(data => data.submissionType !== 'internal' || !!data.formId, {
    message: "Formulir internal harus dipilih",
    path: ["formId"],
});

type FormData = z.infer<typeof formSchema>;

export default function NewProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [allTags, setAllTags] = useState<ProgramTag[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [forms, setForms] = useState<ProgramForm[]>([]);
  
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
      title: '', description: '', category: 'ongoing', imageUrl: '', imageHint: '',
      tags: [],
      dateRange: { from: new Date(), to: addDays(new Date(), 7) },
      source: 'garda_lestari',
      benefits: '', requiredDocuments: '', submissionType: 'external',
      requiresRecommendation: false,
    },
  });

  const watchSource = watch('source');
  const watchSubmissionType = watch('submissionType');
  const watchTags = watch('tags');

  useEffect(() => {
    async function fetchData() {
      try {
        const [tagsData, partnersData, formsData] = await Promise.all([
          getProgramTags(),
          getPartners(),
          getForms(),
        ]);
        setAllTags(tagsData);
        setPartners(partnersData);
        setForms(formsData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat data pendukung' });
      }
    }
    fetchData();
  }, [toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { dateRange, ...rest } = data;
      const programPayload = {
        ...rest,
        startDate: Timestamp.fromDate(dateRange.from),
        endDate: Timestamp.fromDate(dateRange.to),
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title.replace(/\s+/g, '-')}/600/400`
      };
      await createProgram(programPayload);
      toast({ title: 'Program berhasil dibuat!' });
      router.push('/panel/programs');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat program', description: (error as Error).message });
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
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal membuat gambar', description: (error as Error).message });
      } finally {
          setLoadingImage(false);
      }
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = getValues('tags') || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];
    setValue('tags', newTags, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Program Baru</h1>
          <p className="text-muted-foreground">Isi semua detail yang diperlukan untuk program baru.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/programs')}>Batal</Button>
            <Button type="submit" disabled={loading || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Program
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Informasi Dasar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Program</Label>
                <Input id="title" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" {...register('description')} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label>Kategori Program</Label>
                  <Controller name="category" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="flagship" /> Unggulan</Label>
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="ongoing" /> Berkelanjutan</Label>
                      </RadioGroup>
                  )} />
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label>Tanggal Program</Label>
                  <Controller name="dateRange" control={control} render={({ field }) => (
                      <Popover>
                          <PopoverTrigger asChild>
                          <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value?.from ? (field.value.to ? (
                                  <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                              ) : (format(field.value.from, "LLL dd, y"))
                              ) : (<span>Pilih rentang tanggal</span>)}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={field.value.from}
                              selected={{ from: field.value.from, to: field.value.to }}
                              onSelect={(range) => field.onChange(range || { from: undefined, to: undefined })}
                              numberOfMonths={2}
                          />
                          </PopoverContent>
                      </Popover>
                  )} />
                   {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.from?.message || errors.dateRange.to?.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detail Pendaftaran</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sumber Program</Label>
                   <Controller name="source" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="garda_lestari" /> Garda Lestari</Label>
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="mitra" /> Mitra</Label>
                      </RadioGroup>
                  )} />
                </div>

                {watchSource === 'mitra' && (
                  <div className="space-y-2">
                    <Label htmlFor="partnerId">Pilih Mitra</Label>
                    <Controller name="partnerId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih mitra penyelenggara" /></SelectTrigger>
                        <SelectContent>
                          {partners.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                    {errors.partnerId && <p className="text-sm text-destructive">{errors.partnerId.message}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Tipe Pendaftaran</Label>
                  <Controller name="submissionType" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="internal" /> Internal (via form di aplikasi)</Label>
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="external" /> Eksternal (via link)</Label>
                      </RadioGroup>
                  )} />
                </div>
                
                {watchSubmissionType === 'external' && (
                  <div className="space-y-2">
                      <Label htmlFor="applicationUrl">URL Pendaftaran Eksternal</Label>
                      <Input id="applicationUrl" {...register('applicationUrl')} placeholder="https://..."/>
                      {errors.applicationUrl && <p className="text-sm text-destructive">{errors.applicationUrl.message}</p>}
                  </div>
                )}
                {watchSubmissionType === 'internal' && (
                  <div className="space-y-2">
                    <Label htmlFor="formId">Pilih Formulir Internal</Label>
                    <Controller name="formId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih formulir pendaftaran" /></SelectTrigger>
                        <SelectContent>
                          {forms.map(f => <SelectItem key={f.id} value={f.id!}>{f.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                     {errors.formId && <p className="text-sm text-destructive">{errors.formId.message}</p>}
                  </div>
                )}

                 <div className="flex items-center space-x-2 pt-2">
                    <Controller name="requiresRecommendation" control={control} render={({ field }) => (
                      <Switch id="requiresRecommendation" checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                    <Label htmlFor="requiresRecommendation">Garda Lestari menyediakan surat rekomendasi untuk program ini</Label>
                </div>
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Media & Kategori</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="imageHint">Petunjuk Gambar Sampul</Label>
                  <div className="flex gap-2">
                      <Input id="imageHint" {...register('imageHint')} />
                      <Button type="button" onClick={handleGenerateImage} disabled={loadingImage} size="icon"><Wand2 className="h-4 w-4" /></Button>
                  </div>
                  {errors.imageHint && <p className="text-sm text-destructive">{errors.imageHint.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL Gambar Sampul</Label>
                  <Input id="imageUrl" {...register('imageUrl')} />
                  {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label>Tag Program</Label>
                  <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                          <Button key={tag.id} type="button" variant={watchTags.includes(tag.name) ? 'default' : 'outline'} size="sm" onClick={() => handleTagToggle(tag.name)}>
                              {tag.name}
                          </Button>
                      ))}
                  </div>
                  {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader><CardTitle>Informasi Tambahan</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="benefits">Benefit Program (satu per baris)</Label>
                    <Textarea id="benefits" {...register('benefits')} placeholder="- Sertifikat&#10;- Relasi&#10;- Pengalaman" />
                    {errors.benefits && <p className="text-sm text-destructive">{errors.benefits.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredDocuments">Dokumen Persyaratan (satu per baris)</Label>
                    <Textarea id="requiredDocuments" {...register('requiredDocuments')} placeholder="- CV&#10;- KTP&#10;- Esai" />
                    {errors.requiredDocuments && <p className="text-sm text-destructive">{errors.requiredDocuments.message}</p>}
                  </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
