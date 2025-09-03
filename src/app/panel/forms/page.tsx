
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useEffect, useState } from 'react';
import { getForms, deleteForm, ProgramForm } from '@/app/actions/forms';
import { useToast } from '@/hooks/use-toast';

export default function AdminFormsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = useState<ProgramForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [formToDelete, setFormToDelete] = useState<ProgramForm | null>(null);

  const fetchForms = async () => {
      setLoading(true);
      try {
        const fetchedForms = await getForms();
        setForms(fetchedForms);
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Gagal memuat formulir",
        });
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDeleteClick = (form: ProgramForm) => {
    setFormToDelete(form);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (formToDelete && formToDelete.id) {
        setIsDeleting(formToDelete.id);
        try {
            await deleteForm(formToDelete.id);
            toast({ title: "Formulir telah dihapus." });
            fetchForms();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal menghapus formulir",
                description: (error as Error).message,
            });
        } finally {
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setFormToDelete(null);
        }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Formulir</h1>
            <p className="text-muted-foreground">Buat dan kelola formulir pendaftaran untuk program internal.</p>
          </div>
          <Button onClick={() => router.push('/panel/forms/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Formulir Baru
          </Button>
        </div>
        <Card>
          <CardHeader>
             <CardTitle>Daftar Formulir</CardTitle>
             <CardDescription>Total {forms.length} formulir ditemukan.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Jumlah Field</TableHead>
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-10">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : forms.length > 0 ? (
                  forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.title}</TableCell>
                      <TableCell>{form.fields.length}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === form.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/panel/forms/edit/${form.id}`)}>
                              Edit
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => {}}>
                              Lihat Pengajuan
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(form)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            Belum ada formulir yang dibuat.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus formulir <span className="font-semibold">"{formToDelete?.title}"</span> secara permanen.
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
