
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { getProgramTags, addProgramTag, deleteProgramTag, ProgramTag } from '@/app/actions/programs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';

interface FormData {
  name: string;
}

export default function TagProgramPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();
  const [tags, setTags] = useState<ProgramTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProgramTag | null>(null);

 const fetchTags = useCallback(async () => {
    try {
      const fetchedTags = await getProgramTags();
      setTags(fetchedTags);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat tag' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchTags();
  }, [fetchTags]);

  const onSubmit = async (data: FormData) => {
    try {
      await addProgramTag(data.name);
      toast({ title: 'Tag berhasil ditambahkan!' });
      reset();
      fetchTags();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
    }
  };

  const handleDeleteClick = (tag: ProgramTag) => {
    setItemToDelete(tag);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete && itemToDelete.id) {
      try {
        await deleteProgramTag(itemToDelete.id);
        toast({ title: 'Tag dihapus!' });
        fetchTags();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
      } finally {
        setShowDeleteAlert(false);
        setItemToDelete(null);
      }
    }
  };
  
  const columns = useMemo<ColumnDef<ProgramTag>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(row.original)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    }
  ], []);

  return (
    <>
    <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="font-headline text-2xl font-bold">Kelola Tag Program</h1>
            <p className="text-muted-foreground">Tambah, hapus, dan kelola semua tag untuk program.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/panel/programs')}>Kembali ke Program</Button>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Tambah Tag Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
              <Input {...register('name', { required: true })} placeholder="Nama tag..." />
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
            <CardTitle>Daftar Tag</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <DataTable columns={columns} data={tags} placeholder="Cari tag..." />
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
              Tindakan ini akan menghapus tag <span className="font-semibold">"{itemToDelete?.name}"</span> secara permanen.
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
