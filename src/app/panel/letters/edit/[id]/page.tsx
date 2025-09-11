'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, Paperclip } from 'lucide-react';
import { getLetter, updateLetter, LetterCategory, Letter } from '@/app/actions/letters';
import { getLetterCategories } from '@/app/actions/letter-categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

type FormData = Omit<Letter, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'status' | 'fileUrl' | 'fileName' | 'approvedAt' | 'approvedBy' | 'approverId'>;

export default function EditLetterPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<LetterCategory[]>([]);
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
            const [letterData, categoriesData] = await Promise.all([
                getLetter(letterId),
                getLetterCategories()
            ]);
            setCategories(categoriesData);

            if (letterData) {
                if (letterData.authorId !== user?.uid) {
                    toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda bukan pemilik surat ini.' });
                    router.push('/panel/letters');
                    return;
                }
                reset(letterData);
                if (letterData.fileName && letterData.fileUrl) {
                    setCurrentFile({ name: letterData.fileName, url: letterData.fileUrl });
                }
            } else {
                toast({ variant: 'destructive', title: 'Surat tidak ditemukan' });
                router.push('/panel/letters');
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
  }, [letterId, reset, router, toast, user]);


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { file, ...letterData } = data;
      await updateLetter(letterId, letterData, file?.[0]);
      toast({ title: 'Surat berhasil diperbarui!' });
      router.push('/panel/letters');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui surat', description: (error as Error).message });
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
          <h1 className="font-headline text-2xl font-bold">Edit Draf Surat</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push('/panel/letters')}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Detail Surat</CardTitle>
            <CardDescription>Perbarui informasi surat di bawah ini. Anda hanya bisa mengedit surat yang masih berstatus "Draf".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Perihal Surat</Label>
                <Input id="title" {...register('title')} />
                 {/* Error handling can be added here */}
            </div>
             <div className="space-y-2">
                <Label htmlFor="documentNumber">Nomor Surat</Label>
                <Input id="documentNumber" {...register('documentNumber')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori Surat</Label>
                    <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih kategori surat" /></SelectTrigger>
                            <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="destination">Tujuan Surat</Label>
                    <Input id="destination" {...register('destination')} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="file">File Surat (PDF)</Label>
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
