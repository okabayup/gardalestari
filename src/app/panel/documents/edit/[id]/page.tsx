
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip } from 'lucide-react';
import { getDocument, updateDocument, DocumentCategory, ImportantDocument } from '@/app/actions/documents';
import { getDocumentCategories } from '@/app/actions/documents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

type FormData = Omit<ImportantDocument, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'status' | 'fileUrl' | 'fileName' | 'approvedAt' | 'approvedById' | 'approvedByName' | 'approverId' | 'rejectionReason'> & { file?: FileList };

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [currentFile, setCurrentFile] = useState<{name: string, url: string} | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>();
  
  const uploadedFile = watch("file");
  const uploadedFileName = uploadedFile?.[0]?.name;

  useEffect(() => {
    async function fetchData() {
        setPageLoading(true);
        try {
            const [documentData, categoriesData] = await Promise.all([
                getDocument(documentId),
                getDocumentCategories()
            ]);
            setCategories(categoriesData);

            if (documentData) {
                if (documentData.authorId !== user?.uid) {
                    toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda bukan pemilik dokumen ini.' });
                    router.push('/panel/documents');
                    return;
                }
                reset(documentData);
                if (documentData.fileName && documentData.fileUrl) {
                    setCurrentFile({ name: documentData.fileName, url: documentData.fileUrl });
                }
            } else {
                toast({ variant: 'destructive', title: 'Dokumen tidak ditemukan' });
                router.push('/panel/documents');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal memuat data' });
        } finally {
            setPageLoading(false);
        }
    }
    if (user) {
        fetchData();
    }
  }, [documentId, reset, router, toast, user]);


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { file, ...documentData } = data;
      await updateDocument(documentId, documentData, file?.[0]);
      toast({ title: 'Dokumen berhasil diperbarui!' });
      router.push('/panel/documents');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui dokumen', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Edit Draf Dokumen</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/documents')}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Dokumen</CardTitle>
            <CardDescription>Perbarui informasi dokumen di bawah ini. Anda hanya bisa mengedit dokumen yang masih berstatus "Draf".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Perihal Dokumen</Label>
                <Input id="title" {...register('title')} />
                 {/* Error handling can be added here */}
            </div>
             <div className="space-y-2">
                <Label htmlFor="documentNumber">Nomor Dokumen</Label>
                <Input id="documentNumber" {...register('documentNumber')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori Dokumen</Label>
                    <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori dokumen" /></SelectTrigger>
                            <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Tujuan Dokumen</Label>
                    <Input id="description" {...register('description')} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="file">File Dokumen (PDF)</Label>
                <Input id="file" type="file" {...register('file')} accept=".pdf" />
                {uploadedFileName ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {uploadedFileName}</p>
                ) : currentFile && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Paperclip className="h-4 w-4"/> 
                        File saat ini: <Link href={currentFile.url} target="_blank" className="hover:underline text-primary">{currentFile.name}</Link>
                    </p>
                )}
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
