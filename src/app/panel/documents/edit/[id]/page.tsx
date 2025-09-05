
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Paperclip } from 'lucide-react';
import { getDocument, updateDocument, getDocumentCategories, DocumentCategory } from '@/app/actions/documents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  category: z.string({ required_error: 'Kategori wajib dipilih' }),
  file: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
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
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const newFile = watch("file");
  const newFileName = newFile?.[0]?.name;

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setPageLoading(true);
        try {
          const [docData, catData] = await Promise.all([getDocument(id), getDocumentCategories()]);
          setCategories(catData);
          if (docData) {
            reset(docData);
            if (docData.fileUrl && docData.fileName) {
              setCurrentFile({ name: docData.fileName, url: docData.fileUrl });
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
      };
      fetchData();
    }
  }, [id, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { file, ...docData } = data;
      await updateDocument(id, docData, file?.[0]);
      toast({ title: 'Dokumen berhasil diperbarui!' });
      router.push('/panel/documents');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui', description: (error as Error).message });
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Edit Dokumen</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/documents')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Dokumen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Dokumen</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File (kosongkan jika tidak ingin mengubah)</Label>
            <Input id="file" type="file" {...register('file')} />
            {newFileName ? (
               <p className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4"/> {newFileName}</p>
             ) : currentFile ? (
               <p className="text-sm text-muted-foreground flex items-center gap-2">
                 <Paperclip className="h-4 w-4"/> 
                 <Link href={currentFile.url} target="_blank" className="hover:underline text-primary">{currentFile.name}</Link>
               </p>
             ) : null}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
