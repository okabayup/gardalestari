
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
import { Loader2, Calendar as CalendarIcon, Sparkles, Paperclip, Upload, Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { addDays, format } from 'date-fns';
import { createProgram, getProgramTags, ProgramTag, ProgramFormData } from '@/app/actions/programs';
import { getPartners, Partner } from '@/app/actions/partners';
import { getForms, ProgramForm } from '@/app/actions/forms';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { cn } from '@/lib/utils';
import { DateRange } from "react-day-picker";

const imageSourceSchema = z.enum(['ai', 'url', 'upload']);

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  category: z.enum(['flagship', 'ongoing'], { required_error: 'Kategori program wajib dipilih' }),
  programType: z.enum(['aktif', 'pasif'], { required_error: 'Jenis program wajib dipilih' }),
  imageSource: imageSourceSchema.default('ai'),
  imageUrl: z.string().optional(),
  imageHint: z.string().optional(),
  imageFile: z.any().optional(),
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
  attachment: z.any().optional(),
})
.refine(data => data.source !== 'mitra' || !!data.partnerId, {
    message: "Mitra harus dipilih jika sumbernya adalah mitra",
    path: ["partnerId"],
})
.refine(data => data.submissionType !== 'external' || (!!data.applicationUrl && z.string().url().safeParse(data.applicationUrl).success), {
    message: "URL pendaftaran eksternal harus valid",
    path: ["applicationUrl"],
})
.refine(data => data.submissionType !== 'internal' || !!data.formId, {
    message: "Formulir internal harus dipilih",
    path: ["formId"],
})
.refine(data => {
    if (data.imageSource === 'url') return !!data.imageUrl && z.string().url().safeParse(data.imageUrl).success;
    return true;
}, { message: "URL Gambar tidak valid", path: ["imageUrl"]})
.refine(data => {
    if (data.imageSource === 'ai') return !!data.imageHint;
    return true;
}, { message: "Petunjuk AI wajib diisi", path: ["imageHint"]})
.refine(data => {
    if (data.imageSource === 'upload') return !!data.imageFile && data.imageFile.length > 0;
    return true;
}, { message: "File gambar wajib diunggah", path: ["imageFile"]});


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
      title: '', description: '', category: 'ongoing', programType: 'aktif', imageUrl: '', imageHint: '', imageSource: 'ai',
      tags: [],
      dateRange: { from: new Date(), to: addDays(new Date(), 7) },
      source: 'garda_lestari',
      benefits: '', requiredDocuments: '', submissionType: 'external',
      requiresRecommendation: false,
    },
  });

  const watchSource = watch('source');
  const watchSubmissionType = watch('submissionType');
  const watchImageSource = watch('imageSource');
  const watchTags = watch('tags', []);
  const attachmentFile = watch("attachment");
  const attachmentFileName = attachmentFile?.[0]?.name;


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

    let imageUrl = data.imageUrl || '';
    let imageFile: File | undefined = data.imageFile?.[0];

    if (data.imageSource === 'ai' && data.imageHint) {
        toast({ title: 'AI sedang membuat gambar sampul...' });
        setLoadingImage(true);
        try {
            const result = await generateImage({ prompt: data.imageHint });
            if (!result.imageUrl) throw new Error("AI gagal membuat gambar.");
            const response = await fetch(result.imageUrl);
            const blob = await response.blob();
            imageFile = new File([blob], "ai-generated-image.png", { type: "image/png" });
            imageUrl = ''; // Clear URL if AI image is used
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal membuat gambar AI', description: (error as Error).message });
            setLoading(false); setLoadingImage(false); return;
        }
        setLoadingImage(false);
    } else if (data.imageSource === 'url') {
      imageFile = undefined;
    } else {
      imageUrl = '';
    }

    try {
      const { dateRange, attachment, ...rest } = data;
      const programPayload: ProgramFormData = {
        ...rest,
        startDate: dateRange.from,
        endDate: dateRange.to,
        imageUrl,
      };
      
      await createProgram(programPayload, imageFile, attachment?.[0]);

      toast({ title: 'Program berhasil dibuat!' });
      router.push('/panel/programs');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat program', description: (error as Error).message });
      setLoading(false);
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
              {(loading || loadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label>Jenis Program</Label>
                      <Controller name="programType" control={control} render={({ field }) => (
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                              <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="aktif" /> Aktif (Pendaftaran)</Label>
                              <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="pasif" /> Pasif (Internal)</Label>
                          </RadioGroup>
                      )} />
                      {errors.programType && <p className="text-sm text-destructive">{errors.programType.message}</p>}
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Tanggal Program</Label>
                  <Controller name="dateRange" control={control} render={({ field }) => (
                      <Popover>
                          <PopoverTrigger asChild>
                          <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
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
                              numberOfMonths={1}
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
                <Label>Sumber Gambar Sampul</Label>
                 <Controller
                    name="imageSource"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2">
                             <Label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-xs">AI</span>
                                <RadioGroupItem value="ai" className="sr-only" />
                             </Label>
                             <Label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <LinkIcon className="h-5 w-5" />
                                <span className="text-xs">URL</span>
                                <RadioGroupItem value="url" className="sr-only" />
                             </Label>
                             <Label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <Upload className="h-5 w-5" />
                                <span className="text-xs">Unggah</span>
                                <RadioGroupItem value="upload" className="sr-only" />
                             </Label>
                        </RadioGroup>
                    )}
                />
              </div>

               {watchImageSource === 'ai' && (
                 <div className="space-y-2">
                    <Label htmlFor="imageHint">Petunjuk Gambar (AI)</Label>
                    <Input id="imageHint" {...register('imageHint')} placeholder="Contoh: pemuda menanam pohon di hutan"/>
                     {errors.imageHint && <p className="text-sm text-destructive">{errors.imageHint.message}</p>}
                 </div>
               )}
                {watchImageSource === 'url' && (
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL Gambar</Label>
                        <Input id="imageUrl" {...register('imageUrl')} placeholder="https://..."/>
                        {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                    </div>
                )}
                {watchImageSource === 'upload' && (
                    <div className="space-y-2">
                        <Label htmlFor="imageFile">Unggah File Gambar</Label>
                        <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
                        {errors.imageFile && <p className="text-sm text-destructive">{(errors.imageFile as any).message}</p>}
                    </div>
                )}
              
              <div className="space-y-2 pt-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="attachment">Berkas Lampiran (Opsional)</Label>
                    <Input id="attachment" type="file" {...register('attachment')} />
                    {attachmentFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {attachmentFileName}</p>}
                    {errors.attachment && <p className="text-sm text-destructive">{(errors.attachment as any).message}</p>}
                 </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

    