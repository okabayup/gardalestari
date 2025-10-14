
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { format } from 'date-fns';
import { getEvent, updateEvent } from '@/app/actions/events';
import { getForms, ProgramForm } from '@/app/actions/forms';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  dateRange: z.object({
    from: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
    to: z.date().optional(),
  }),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  visibility: z.enum(['public', 'member']),
  submissionType: z.enum(['internal', 'external']),
  applicationUrl: z.string().optional(),
  formId: z.string().optional(),
  imageSource: z.enum(['ai', 'url', 'upload']),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  imageHint: z.string().optional(),
  imageFile: z.any().optional(),
  attachment: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<{name: string, url: string} | null>(null);
  const [forms, setForms] = useState<ProgramForm[]>([]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    watch,
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const watchSubmissionType = watch('submissionType');
  const watchImageSource = watch('imageSource');
  const attachmentFile = watch("attachment");
  const attachmentFileName = attachmentFile?.[0]?.name;

  useEffect(() => {
    if (eventId) {
      Promise.all([
          getEvent(eventId),
          getForms()
      ]).then(([event, formsData]) => {
          if (event) {
            setForms(formsData);
            reset({
                ...event,
                dateRange: { from: event.startDate, to: event.endDate },
            });
            if(event.attachmentUrl && event.attachmentName) {
                setCurrentAttachment({name: event.attachmentName, url: event.attachmentUrl})
            }
          } else {
            toast({ variant: 'destructive', title: 'Acara tidak ditemukan' });
            router.push('/panel/events');
          }
      }).catch(() => {
          toast({ variant: 'destructive', title: 'Gagal memuat acara' });
      }).finally(() => {
          setPageLoading(false);
      });
    }
  }, [eventId, reset, router, toast]);

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
      await updateEvent(eventId, formData);
      toast({ title: 'Acara berhasil diperbarui!' });
      router.push('/panel/events');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui acara', description: (error as Error).message });
      setLoading(false);
    }
  };

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
  
  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Edit Acara</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/events')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || loadingImage}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Acara</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="title">Judul Acara</Label>
                <Input id="title" {...register('title')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input id="slug" {...register('slug')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input id="location" {...register('location')} />
              </div>
              <div className="space-y-2">
                <Label>Visibilitas</Label>
                 <Controller name="visibility" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="public" /> Publik</Label>
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="member" /> Anggota</Label>
                    </RadioGroup>
                )} />
              </div>
              <div className="space-y-2">
                <Label>Tipe Pendaftaran</Label>
                 <Controller name="submissionType" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="internal" /> Internal</Label>
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="external" /> Eksternal</Label>
                    </RadioGroup>
                )} />
              </div>
          </div>

          {watchSubmissionType === 'external' && (
            <div className="space-y-2">
                <Label htmlFor="applicationUrl">URL Pendaftaran Eksternal</Label>
                <Input id="applicationUrl" {...register('applicationUrl')} />
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
                    <div className="flex gap-2"><Input id="imageHint" {...register('imageHint')} /><Button type="button" onClick={handleGenerateImage} disabled={loadingImage}><Wand2 className="mr-2 h-4 w-4" />Buat</Button></div>
                </div>
            )}
            {watchImageSource === 'url' && (
                <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL Gambar</Label>
                    <Input id="imageUrl" {...register('imageUrl')} />
                </div>
            )}
            {watchImageSource === 'upload' && (
                <div className="space-y-2">
                    <Label htmlFor="imageFile">File Gambar (kosongkan jika tidak diubah)</Label>
                    <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
                </div>
            )}

             <div className="space-y-2">
                <Label htmlFor="attachment">Lampiran (kosongkan jika tidak ingin mengubah)</Label>
                <Input id="attachment" type="file" {...register('attachment')} />
                 {attachmentFileName ? (
                   <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {attachmentFileName}</p>
                 ) : currentAttachment ? (
                   <p className="text-sm text-muted-foreground flex items-center gap-2">
                     <Paperclip className="h-4 w-4"/> 
                     <Link href={currentAttachment.url} target="_blank" className="hover:underline text-primary">{currentAttachment.name}</Link>
                   </p>
                 ) : null}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
