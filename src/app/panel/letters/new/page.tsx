
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Paperclip } from 'lucide-react';
import { createLetter, generateLetterNumber, LetterCategory, Letter } from '@/app/actions/letters';
import { getLetterCategories } from '@/app/actions/letter-categories';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FormData = Omit<Letter, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'status' | 'fileUrl' | 'fileName' | 'approvedAt' | 'approvedBy' | 'approverId'>;

export default function NewLetterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<LetterCategory[]>([]);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>();
  
  const selectedCategory = watch("category");
  const uploadedFile = watch("file");
  const uploadedFileName = uploadedFile?.[0]?.name;

  useEffect(() => {
    getLetterCategories().then(setCategories);
  }, []);
  
   useEffect(() => {
    if (selectedCategory) {
      const generateNumber = async () => {
        setIsGeneratingNumber(true);
        try {
          const number = await generateLetterNumber(selectedCategory);
          setValue('documentNumber', number);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal membuat nomor surat' });
        } finally {
          setIsGeneratingNumber(false);
        }
      };
      generateNumber();
    }
  }, [selectedCategory, setValue, toast]);


  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus login untuk membuat surat' });
        return;
    }
    if (!data.file || data.file.length === 0) {
        toast({ variant: 'destructive', title: 'File surat wajib diunggah' });
        return;
    }
    setLoading(true);
    try {
      const { file, ...letterData } = data;
      const payload: Omit<Letter, 'id' | 'fileUrl' | 'fileName' | 'status' | 'createdAt'> = {
          ...letterData,
          authorId: user.uid,
          authorName: user.displayName || 'Pengguna',
      }
      await createLetter(payload, file[0]);
      toast({ title: 'Surat berhasil dibuat!' });
      router.push('/panel/letters');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat surat', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Draf Surat Baru</h1>
          <p className="text-muted-foreground">Isi detail di bawah untuk membuat surat baru.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/letters')}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Draf
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Surat</CardTitle>
            <CardDescription>Informasi utama mengenai surat yang akan dibuat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Perihal Surat</Label>
                <Input id="title" {...register('title')} placeholder="Contoh: Surat Permohonan Audiensi" />
                 {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="documentNumber">Nomor Surat</Label>
                <div className="flex items-center gap-2">
                    <Input id="documentNumber" {...register('documentNumber')} disabled={isGeneratingNumber} placeholder="Nomor surat akan dibuat otomatis..." />
                    {isGeneratingNumber && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {errors.documentNumber && <p className="text-sm text-destructive">{errors.documentNumber.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori Surat</Label>
                    <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Kategori wajib dipilih" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori surat" /></SelectTrigger>
                            <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="destination">Tujuan Surat</Label>
                    <Input id="destination" {...register('destination')} placeholder="Contoh: Yth. Menteri Pertanian" />
                    {errors.destination && <p className="text-sm text-destructive">{errors.destination.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="file">File Surat (PDF)</Label>
                <Input id="file" type="file" {...register('file')} accept=".pdf" />
                 {uploadedFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {uploadedFileName}</p>}
                 {errors.file && <p className="text-sm text-destructive">File wajib diunggah</p>}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
