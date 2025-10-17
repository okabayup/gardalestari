

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
import { Loader2, Calendar as CalendarIcon, Wand2, Paperclip, Upload, Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { createEvent } from '@/app/actions/events';
import { getForms, ProgramForm } from '@/app/actions/forms';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  dateRange: z.object({
    from: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
    to: z.date().optional(),
  }),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  visibility: z.enum(['public', 'member']).default('public'),
  submissionType: z.enum(['internal', 'external']).default('external'),
  applicationUrl: z.string().optional(),
  formId: z.string().optional(),
  imageSource: z.enum(['ai', 'url', 'upload']).default('ai'),
  imageUrl: z.string().optional(),
  imageHint: z.string().optional(),
  imageFile: z.any().optional(),
  attachment: z.any().optional(),
}).refine(data => data.submissionType !== 'external' || (!!data.applicationUrl && z.string().url().safeParse(data.applicationUrl).success), {
  message: "URL Pendaftaran eksternal tidak valid atau wajib diisi",
  path: ["applicationUrl"],
}).refine(data => data.submissionType !== 'internal' || !!data.formId, {
  message: "Formulir wajib dipilih untuk tipe internal",
  path: ["formId"],
});


type FormData = z.infer<typeof formSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
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
      title: '',
      slug: '',
      description: '',
      dateRange: { from: new Date(), to: addDays(new Date(), 1) },
      location: '',
      visibility: 'public',
      submissionType: 'external',
      imageSource: 'ai',
    },
  });

  useEffect(() => {
    getForms().then(setForms);
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    setValue('slug', generateSlug(newTitle));
  };
  
  const watchSubmissionType = watch('submissionType');
  const watchImageSource = watch('imageSource');
  const attachmentFile = watch("attachment");
  const attachmentFileName = attachmentFile?.[0]?.name;
  
  const handleGenerateImage = async () => {
      const imageHint = getValues('imageHint');
      if (!imageHint || !imageHint.trim()) {
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


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'dateRange') {
            formData.append('dateRangeFrom', (value as {from: Date}).from.toISOString());
            if ((value as {to?: Date}).to) {
                formData.append('dateRangeTo', ((value as {to: Date}).to!).toISOString());
            }
        } else if (key === 'imageFile' || key === 'attachment') {
             if (value && (value as FileList).length > 0) {
                formData.append(key, (value as FileList)[0]);
            }
        } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    try {
      await createEvent(formData);
      toast({ title: 'Acara berhasil dibuat!' });
      router.push('/panel/events');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat acara', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Acara Baru</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/events')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Acara
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Acara</CardTitle>
            <CardDescription>Informasi utama mengenai acara yang akan diselenggarakan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="title">Judul Acara</Label>
                <Input id="title" {...register('title')} onChange={handleTitleChange}/>
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input id="slug" {...register('slug')} />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Acara</Label>
                <Controller name="dateRange" control={control} render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "d MMM y")} - {format(field.value.to, "d MMM y")}</>) : (format(field.value.from, "d MMM y"))) : (<span>Pilih rentang tanggal</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value} onSelect={field.onChange} numberOfMonths={1} />
                        </PopoverContent>
                    </Popover>
                )} />
                 {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.root?.message || errors.dateRange.from?.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input id="location" {...register('location')} />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Visibilitas</Label>
                 <Controller name="visibility" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="public" /> Publik</Label>
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="member" /> Anggota</Label>
                    </RadioGroup>
                )} />
                 {errors.visibility && <p className="text-sm text-destructive">{errors.visibility.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipe Pendaftaran</Label>
                 <Controller name="submissionType" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="internal" /> Internal</Label>
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="external" /> Eksternal</Label>
                    </RadioGroup>
                )} />
                 {errors.submissionType && <p className="text-sm text-destructive">{errors.submissionType.message}</p>}
              </div>
          </div>

          {watchSubmissionType === 'external' && (
            <div className="space-y-2">
                <Label htmlFor="applicationUrl">URL Pendaftaran Eksternal</Label>
                <Input id="applicationUrl" {...register('applicationUrl')} />
                {errors.applicationUrl && <p className="text-sm text-destructive">{errors.applicationUrl.message}</p>}
            </div>
            )}
            {watchSubmissionType === 'internal' && (
            <div className="space-y-2">
                <Label htmlFor="formId">Pilih Formulir Internal</Label>
                <Controller name="formId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih formulir pendaftaran" /></SelectTrigger>
                    <SelectContent>
                    {forms.map(f => <SelectItem key={f.id} value={f.id!}>{f.title}</SelectItem>)}
                    </SelectContent>
                </Select>
                )} />
                {errors.formId && <p className="text-sm text-destructive">{errors.formId.message}</p>}
            </div>
            )}

            <div className="space-y-2">
                <Label>Sumber Gambar</Label>
                 <Controller name="imageSource" control={control} render={({ field }) => (
                     <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2">
                         <Label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                            <Wand2 className="h-5 w-5" /><span className="text-xs">AI</span><RadioGroupItem value="ai" className="sr-only" />
                         </Label>
                         <Label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                            <LinkIcon className="h-5 w-5" /><span className="text-xs">URL</span><RadioGroupItem value="url" className="sr-only" />
                         </Label>
                         <Label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                            <Upload className="h-5 w-5" /><span className="text-xs">Unggah</span><RadioGroupItem value="upload" className="sr-only" />
                         </Label>
                    </RadioGroup>
                )} />
            </div>
            {watchImageSource === 'ai' && (
                <div className="space-y-2">
                    <Label htmlFor="imageHint">Petunjuk Gambar (AI)</Label>
                    <div className="flex gap-2">
                        <Input id="imageHint" {...register('imageHint')} placeholder="Contoh: sekelompok anak muda menanam pohon mangrove di pantai"/>
                        <Button type="button" onClick={handleGenerateImage} disabled={loadingImage}><Wand2 className="mr-2 h-4 w-4" />Buat</Button>
                    </div>
                </div>
            )}
            {watchImageSource === 'url' && (
                <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL Gambar</Label>
                    <Input id="imageUrl" {...register('imageUrl')} />
                    {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                </div>
            )}
            {watchImageSource === 'upload' && (
                <div className="space-y-2">
                    <Label htmlFor="imageFile">File Gambar</Label>
                    <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
                    {errors.imageFile && <p className="text-sm text-destructive">{(errors.imageFile as any).message}</p>}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="attachment">Berkas Lampiran (Opsional)</Label>
                <Input id="attachment" type="file" {...register('attachment')} />
                {attachmentFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {attachmentFileName}</p>}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
