
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
import { getPartners, Partner } from '@/app/actions/partners';
import { getForms, ProgramForm } from '@/app/actions/forms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';


type FormData = Omit<Program, 'id' | 'startDate' | 'endDate' | 'tags'> & {
  dateRange: DateRange | undefined;
  tags: string[];
};

export default function NewProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<ProgramTag[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [forms, setForms] = useState<ProgramForm[]>([]);


  const form = useForm<FormData>({
    defaultValues: {
      tags: [],
      category: 'flagship',
      source: 'garda_lestari',
      submissionType: 'external',
      requiresRecommendation: false,
    }
  });

  const { control, watch } = form;
  const watchedSource = watch('source');
  const watchedSubmissionType = watch('submissionType');

  useEffect(() => {
    const fetchData = async () => {
      const [tags, partners, forms] = await Promise.all([getProgramTags(), getPartners(), getForms()]);
      setAvailableTags(tags);
      setPartners(partners);
      setForms(forms);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!data.dateRange?.from || !data.dateRange?.to) {
        toast({ variant: 'destructive', title: 'Rentang Tanggal Diperlukan' });
        return;
    }
    
    setLoading(true);
    try {
        const newProgram: Omit<Program, 'id'> = {
            ...data,
            startDate: Timestamp.fromDate(data.dateRange.from),
            endDate: Timestamp.fromDate(data.dateRange.to),
            imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.title.replace(/\s+/g, '-')}/600/400`,
            imageHint: data.imageHint || 'program activity',
            // Clear partnerId if not from partner
            partnerId: data.source === 'mitra' ? data.partnerId : '',
            // Clear applicationUrl if not external
            applicationUrl: data.submissionType === 'external' ? data.applicationUrl : '',
            formId: data.submissionType === 'internal' ? data.formId : '',
        };
        delete (newProgram as any).dateRange;

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
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Buat Program Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk membuat program kerja baru.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Nama Program</Label>
                <Input id="title" placeholder="Nama program yang jelas..." {...form.register('title', { required: true })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Kategori</Label>
                    <FormField
                        control={control}
                        name="category"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="flagship">Program Unggulan (Flagship)</SelectItem>
                                    <SelectItem value="ongoing">Inisiatif Berkelanjutan (Ongoing)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Rentang Waktu Program</Label>
                     <FormField
                        control={control}
                        name="dateRange"
                        render={({ field }) => (
                           <Popover>
                                <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pilih rentang tanggal</span>)}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value} onSelect={field.onChange} numberOfMonths={2}/>
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                </div>
              </div>
            
            <Separator />
            <div className="space-y-4">
                <h3 className="font-medium">Detail Program</h3>
                <div className="space-y-2">
                    <Label>Deskripsi Lengkap</Label>
                    <Textarea rows={5} placeholder="Jelaskan program secara detail..." {...form.register('description', { required: true })}/>
                </div>
                <div className="space-y-2">
                    <Label>Benefit/Keuntungan Program</Label>
                    <Textarea rows={5} placeholder="Contoh: Sertifikat, Uang saku, Relasi..." {...form.register('benefits', { required: true })}/>
                </div>
                 <div className="space-y-2">
                    <Label>Berkas yang Diperlukan</Label>
                    <Textarea rows={5} placeholder="Contoh: CV, Portofolio, KTP..." {...form.register('requiredDocuments', { required: true })}/>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                 <h3 className="font-medium">Detail Pendaftaran</h3>
                 <FormField
                    control={control}
                    name="source"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Sumber Program</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="garda_lestari" /></FormControl>
                                <FormLabel className="font-normal">Garda Lestari</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="mitra" /></FormControl>
                                <FormLabel className="font-normal">Mitra</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        </FormItem>
                    )}
                 />
                 {watchedSource === 'mitra' && (
                     <FormField
                        control={control}
                        name="partnerId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pilih Mitra</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Pilih mitra penyelenggara" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {partners.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            </FormItem>
                        )}
                    />
                 )}
                 <FormField
                    control={control}
                    name="submissionType"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Jenis Pendaftaran</FormLabel>
                             <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="internal" /></FormControl>
                                    <FormLabel className="font-normal">Internal (Form di App)</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="external" /></FormControl>
                                    <FormLabel className="font-normal">Eksternal (Link)</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                 />
                 {watchedSubmissionType === 'external' && (
                     <FormField
                        control={control}
                        name="applicationUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL Pendaftaran Eksternal</FormLabel>
                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                            </FormItem>
                        )}
                    />
                 )}
                 {watchedSubmissionType === 'internal' && (
                     <FormField
                        control={control}
                        name="formId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pilih Formulir</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Pilih formulir pendaftaran" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {forms.map(f => <SelectItem key={f.id} value={f.id!}>{f.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Buat formulir baru di menu <Link href="/admin/forms" className="underline">Manajemen Formulir</Link>.
                            </FormDescription>
                            </FormItem>
                        )}
                    />
                 )}
                 <FormField
                    control={control}
                    name="requiresRecommendation"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel>Surat Rekomendasi</FormLabel>
                            <p className="text-sm text-muted-foreground">
                            Aktifkan jika Garda Lestari menyediakan surat rekomendasi untuk program ini.
                            </p>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange}/>
                        </FormControl>
                        </FormItem>
                    )}
                    />
            </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar (Opsional)</Label>
                <Input id="imageUrl" placeholder="https://..." {...form.register('imageUrl')} />
                 <p className="text-xs text-muted-foreground">Jika dikosongkan, gambar placeholder akan digunakan.</p>
              </div>

               <div className="space-y-2">
                <Label htmlFor="imageHint">Petunjuk Gambar untuk AI (Opsional)</Label>
                <Input id="imageHint" placeholder="Contoh: youth planting trees" {...form.register('imageHint')} />
                 <p className="text-xs text-muted-foreground">Maksimal 2 kata. Digunakan jika URL gambar tidak diisi.</p>
              </div>
          </CardContent>
        </Card>

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
            </Form>
      </div>
    </MainLayout>
  );
}
