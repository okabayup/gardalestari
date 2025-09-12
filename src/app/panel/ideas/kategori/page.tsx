
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { getIdeaCategories, addIdeaCategory, deleteIdeaCategory, IdeaCategory } from '@/app/actions/ideas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

interface FormData {
  name: string;
}

export default function KategoriIdePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IdeaCategory | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const fetchedCategories = await getIdeaCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat kategori' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await addIdeaCategory(data.name);
      toast({ title: 'Kategori berhasil ditambahkan!' });
      reset();
      fetchCategories();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
    }
  };

  const handleDeleteClick = (category: IdeaCategory) => {
    setItemToDelete(category);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete && itemToDelete.id) {
      try {
        await deleteIdeaCategory(itemToDelete.id);
        toast({ title: 'Kategori dihapus!' });
        fetchCategories();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
      } finally {
        setShowDeleteAlert(false);
        setItemToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
          <div>
              <h1 className="font-headline text-2xl font-bold">Kelola Kategori Ide</h1>
              <p className="text-muted-foreground">Tambah, hapus, dan kelola semua kategori untuk Bank Ide.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/panel/ideas')}>Kembali ke Bank Ide</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
                <Input {...register('name', { required: true })} placeholder="Nama kategori..." />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Tambah</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(cat)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {categories.length === 0 && !loading && (
                <p className="text-center text-sm text-muted-foreground py-4">Belum ada kategori.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus kategori <span className="font-semibold">"{itemToDelete?.name}"</span>. Ini tidak akan menghapus ide yang menggunakan kategori ini.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                Ya, Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
