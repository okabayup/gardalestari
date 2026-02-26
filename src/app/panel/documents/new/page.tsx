'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, Download, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { createDocument, DocumentCategory, DocumentType, ImportantDocument, getDocumentCategories, getDocumentTypes } from '@/app/actions/documents';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

type FormData = Omit<ImportantDocument, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'status' | 'fileUrl' | 'fileName' | 'approvedAt' | 'approvedById' | 'approvedByName' | 'approverId' | 'rejectionReason' | 'documentNumber' | 'filePath'> & { file: FileList };


export default function NewDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const TEMPLATE_URL = "https://www.canva.com/design/DAG1iEQwEnk/dkJaRIGTpYl3JmEmWMK--Q/edit?utm_content=DAG1iEQwEnk&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>();
  
  const uploadedFile = watch("file");
  const uploadedFileName = uploadedFile?.[0]?.name;

  const loadOptions = async () => {
    setFetchingOptions(true);
    try {
        const [cats, types] = await Promise.all([
            getDocumentCategories(),
            getDocumentTypes()
        ]);
        setCategories(cats);
        setDocTypes(types);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat pilihan', description: 'Silakan segarkan halaman.' });
    } finally {
        setFetchingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const payload: Omit<ImportantDocument, 'id' | 'fileUrl' | 'fileName' | 'status' | 'createdAt' | 'documentNumber' | 'filePath'> = {
          ...documentData,
          authorId: user.uid,
          authorName: user.displayName || 'Pengguna',
          approverId: 'aYlG4AVpM2W4Aap25VE8g2BHn3a2' // Default approver UID (Ketum)
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
            <Button type="submit" disabled={loading || fetchingOptions}>
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
                    <CardDescription>Gunakan template, isi, simpan sebagai PDF, lalu unggah.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" type="button" onClick={loadOptions} disabled={fetchingOptions}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", fetchingOptions && "animate-spin")} />
                        Refresh Data
                    </Button>
                    <Button variant="secondary" asChild>
                        <a href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Buka Template
                        </a>
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Perihal Dokumen</Label>
                <Input id="title" {...register('title', { required: "Perihal wajib diisi" })} placeholder="Contoh: Permohonan Audiensi dengan Kementerian" />
                 {errors.title && <p className="text-sm text-destructive">{errors.title?.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Jenis Dokumen</Label>
                    <Controller
                    name="type"
                    control={control}
                    rules={{ required: "Jenis wajib dipilih" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingOptions ? "Memuat..." : "Pilih jenis dokumen"} />
                            </SelectTrigger>
                            <SelectContent>
                            {docTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.type && <p className="text-sm text-destructive">{errors.type?.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="attachments">Jumlah Lampiran</Label>
                  <Input id="attachments" {...register('attachments')} placeholder="Contoh: 1 Berkas" />
              </div>
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
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingOptions ? "Memuat..." : "Pilih kategori surat"} />
                            </SelectTrigger>
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
                  <Input id="description" {...register('description', { required: "Tujuan wajib diisi" })} placeholder="Contoh: Yth. Menteri Pertanian Republik Indonesia" />
                  {errors.description && <p className="text-sm text-destructive">{errors.description?.message}</p>}
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="canvaUrl">Tautan Edit Canva (Opsional)</Label>
                <Input id="canvaUrl" {...register('canvaUrl')} placeholder="https://canva.com/design/..." />
                <p className="text-xs text-muted-foreground">Isi dengan tautan yang bisa diakses oleh admin untuk menambahkan nomor surat.</p>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="file">File Dokumen (.pdf)</Label>
                <Input id="file" type="file" {...register('file', { required: "File wajib diunggah" })} accept=".pdf" />
                 {uploadedFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {uploadedFileName}</p>}
                 {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
