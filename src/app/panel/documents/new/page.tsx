'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, Download, Link as LinkIcon, RefreshCw, Info } from 'lucide-react';
import { createDocument, DocumentCategory, DocumentType, ImportantDocument, getDocumentCategories, getDocumentTypes } from '@/app/actions/documents';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Perihal Dokumen</Label>
                <Input id="title" {...register('title', { required: "Perihal wajib diisi" })} placeholder="Contoh: Permohonan Audiensi dengan Kementerian" />
                 {errors.title && <p className="text-sm text-destructive">{errors.title?.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="type">Jenis Dokumen (untuk Penomoran)</Label>
                        <Info className="h-3 w-3 text-muted-foreground" title="Menentukan kode nomor surat (SK, SE, ST, dll)" />
                    </div>
                    <Controller
                    name="type"
                    control={control}
                    rules={{ required: "Jenis wajib dipilih" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingOptions ? "Memuat..." : "Pilih format hukum surat"} />
                            </SelectTrigger>
                            <SelectContent>
                            {docTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name} ({t.code})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                    <p className="text-[10px] text-muted-foreground">Pilihan ini menentukan kode yang akan muncul di nomor surat.</p>
                    {errors.type && <p className="text-sm text-destructive">{errors.type?.message}</p>}
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="category">Bidang / Klasifikasi Urusan</Label>
                        <Info className="h-3 w-3 text-muted-foreground" title="Digunakan untuk pengelompokan arsip" />
                    </div>
                    <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Kategori wajib dipilih" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingOptions ? "Memuat..." : "Pilih bidang organisasi"} />
                            </SelectTrigger>
                            <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                    <p className="text-[10px] text-muted-foreground">Gunakan ini untuk mengelompokkan dokumen berdasarkan departemen.</p>
                    {errors.category && <p className="text-sm text-destructive">{errors.category?.message}</p>}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="description">Tujuan Dokumen (Penerima)</Label>
                  <Input id="description" {...register('description', { required: "Tujuan wajib diisi" })} placeholder="Contoh: Yth. Menteri Pertanian Republik Indonesia" />
                  {errors.description && <p className="text-sm text-destructive">{errors.description?.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="attachments">Jumlah Lampiran</Label>
                  <Input id="attachments" {...register('attachments')} placeholder="Contoh: 1 Berkas" />
              </div>
            </div>

             <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="canvaUrl">Tautan Kolaborasi Canva (Opsional)</Label>
                <Input id="canvaUrl" {...register('canvaUrl')} placeholder="https://canva.com/design/..." />
                <p className="text-xs text-muted-foreground italic">Tempelkan tautan desain Canva Anda jika ingin admin membantu melakukan penyesuaian tata letak.</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="file">File Dokumen Final (.pdf)</Label>
                <Input id="file" type="file" {...register('file', { required: "File wajib diunggah" })} accept=".pdf" />
                 {uploadedFileName && <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {uploadedFileName}</p>}
                 <p className="text-xs text-muted-foreground">Pastikan dokumen sudah dalam format PDF sebelum diunggah.</p>
                 {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
