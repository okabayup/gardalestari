
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { 
    getDocumentCategories, addDocumentCategory, deleteDocumentCategory, DocumentCategory,
    getDocumentTypes, addDocumentType, deleteDocumentType, DocumentType
} from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FormData {
  name: string;
}

interface TypeFormData {
  name: string;
  code: string;
}

export default function KategoriDokumenPage() {
  const { toast } = useToast();
  const { register: registerCategory, handleSubmit: handleSubmitCategory, reset: resetCategory } = useForm<FormData>();
  const { register: registerType, handleSubmit: handleSubmitType, reset: resetType } = useForm<TypeFormData>();

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'category' | 'type' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedCategories, fetchedTypes] = await Promise.all([getDocumentCategories(), getDocumentTypes()]);
      setCategories(fetchedCategories);
      setTypes(fetchedTypes);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCategorySubmit = async (data: FormData) => {
    try {
      await addDocumentCategory(data.name);
      toast({ title: 'Kategori berhasil ditambahkan!' });
      resetCategory();
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
    }
  };

  const onTypeSubmit = async (data: TypeFormData) => {
    try {
      await addDocumentType(data);
      toast({ title: 'Jenis dokumen berhasil ditambahkan!' });
      resetType();
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
    }
  };

  const handleDeleteClick = (item: { id: string, name: string }, type: 'category' | 'type') => {
    setItemToDelete({ ...item, type });
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
        if (itemToDelete.type === 'category') {
            await deleteDocumentCategory(itemToDelete.id);
        } else {
            await deleteDocumentType(itemToDelete.id);
        }
        toast({ title: 'Item berhasil dihapus!' });
        fetchData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
    } finally {
        setShowDeleteAlert(false);
        setItemToDelete(null);
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
          <div>
              <h1 className="font-headline text-2xl font-bold">Kelola Atribut Dokumen</h1>
              <p className="text-muted-foreground">Atur kategori dan jenis dokumen untuk penomoran otomatis.</p>
          </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jenis Dokumen</CardTitle>
            <CardDescription>Jenis ini digunakan untuk kode dalam penomoran surat.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitType(onTypeSubmit)} className="flex gap-2 mb-4">
              <Input {...registerType('name', { required: true })} placeholder="Nama Jenis (e.g. Surat Keterangan)" />
              <Input {...registerType('code', { required: true })} placeholder="Kode (e.g. S-KET)" className="w-32"/>
              <Button type="submit"><PlusCircle className="h-4 w-4" /></Button>
            </form>
            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
             <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Kode</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {types.map((t) => (
                    <TableRow key={t.id}><TableCell>{t.name}</TableCell><TableCell className="font-mono">{t.code}</TableCell><TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick({id: t.id!, name: t.name}, 'type')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell></TableRow>
                  ))}
                </TableBody>
            </Table>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kategori Dokumen (Legacy)</CardTitle>
            <CardDescription>Kategori umum untuk pengarsipan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitCategory(onCategorySubmit)} className="flex gap-2 mb-4">
              <Input {...registerCategory('name', { required: true })} placeholder="Nama kategori..." />
              <Button type="submit"><PlusCircle className="h-4 w-4" /></Button>
            </form>
             {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
             <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}><TableCell>{cat.name}</TableCell><TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick({id: cat.id!, name: cat.name}, 'category')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell></TableRow>
                  ))}
                </TableBody>
            </Table>}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus <span className="font-semibold">"{itemToDelete?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
