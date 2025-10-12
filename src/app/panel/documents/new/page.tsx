
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, Download } from 'lucide-react';
import { createDocument, generateDocumentNumber, DocumentCategory, ImportantDocument } from '@/app/actions/documents';
import { getDocumentCategories } from '@/app/actions/documents';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

type FormData = Omit<ImportantDocument, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'status' | 'fileUrl' | 'fileName' | 'approvedAt' | 'approvedById' | 'approvedByName' | 'approverId' | 'rejectionReason'> & { file: FileList };


export default function NewDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
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
    getDocumentCategories().then(setCategories);
  }, []);
  
   useEffect(() => {
    if (selectedCategory) {
      const generateNumber = async () => {
        setIsGeneratingNumber(true);
        try {
          const number = await generateDocumentNumber(selectedCategory);
          setValue('documentNumber', number);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal membuat nomor dokumen' });
        } finally {
          setIsGeneratingNumber(false);
        }
      };
      generateNumber();
    }
  }, [selectedCategory, setValue, toast]);


  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus login untuk membuat dokumen' });
        return;
    }
    if (!data.file || data.file.length === 0) {
        toast({ variant: 'destructive', title: 'File dokumen wajib diunggah' });
        return;
    }
    setLoading(true);
    try {
      const { file, ...documentData } = data;
      const payload: Omit<ImportantDocument, 'id' | 'fileUrl' | 'fileName' | 'status' | 'createdAt'> = {
          ...documentData,
          authorId: user.uid,
          authorName: user.displayName || 'Pengguna',
      };
      await createDocument(payload, file[0]);
      toast({ title: 'Dokumen berhasil dibuat!' });
      router.push('/panel/documents');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat dokumen', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buat Draf Dokumen Baru</h1>
          <p className="text-muted-foreground">Isi detail di bawah untuk membuat dokumen baru.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/documents')}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Draf
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Detail Dokumen</CardTitle>
                    <CardDescription>Informasi utama mengenai dokumen yang akan dibuat.</CardDescription>
                </div>
                <Button variant="secondary" asChild>
                    <Link href="/templates/surat_resmi_template.docx" download>
                        <Download className="mr-2 h-4 w-4" />
                        Unduh Template
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Perihal Dokumen</Label>
                <Input id="title" {...register('title')} placeholder="Contoh: Surat Permohonan Audiensi" />
                 {errors.title && <p className="text-sm text-destructive">{errors.title?.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="documentNumber">Nomor Dokumen</Label>
                <div className="flex items-center gap-2">
                    <Input id="documentNumber" {...register('documentNumber')} disabled={isGeneratingNumber} placeholder="Pilih kategori untuk generate nomor..." />
                    {isGeneratingNumber && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {errors.documentNumber && <p className="text-sm text-destructive">{errors.documentNumber?.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori Dokumen</Label>
                    <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Kategori wajib dipilih" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori dokumen" /></SelectTrigger>
                            <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.category && <p className="text-sm text-destructive">{errors.category?.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Tujuan Dokumen</Label>
                    <Input id="description" {...register('description')} placeholder="Contoh: Yth. Menteri Pertanian" />
                    {errors.description && <p className="text-sm text-destructive">{errors.description?.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="file">File Dokumen (DOCX)</Label>
                <Input id="file" type="file" {...register('file')} accept=".docx" />
                 {uploadedFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {uploadedFileName}</p>}
                 {errors.file && <p className="text-sm text-destructive">File wajib diunggah</p>}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
