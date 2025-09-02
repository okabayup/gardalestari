
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, FileInput } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const fetchedForms = await getForms();
        setForms(fetchedForms);
      } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Gagal memuat formulir",
            description: "Terjadi kesalahan saat mengambil data dari server.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, [toast]);

  const handleDeleteClick = (form: ProgramForm) => {
    setFormToDelete(form);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (formToDelete && formToDelete.id) {
        setIsDeleting(formToDelete.id);
        try {
            await deleteForm(formToDelete.id);
            setForms(forms.filter(p => p.id !== formToDelete.id));
            toast({
                title: "Formulir dihapus!",
                description: `"${formToDelete.title}" telah berhasil dihapus.`,
            });
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
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Formulir</h1>
            <p className="text-muted-foreground">Buat dan kelola formulir pendaftaran program.</p>
          </div>
          <Button onClick={() => router.push('/admin/forms/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Formulir Baru
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Formulir</TableHead>
                  <TableHead>Jumlah Field</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
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
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/forms/edit/${form.id}`)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                             <div className="flex flex-col items-center gap-2">
                                <FileInput className="h-8 w-8" />
                                <span>Belum ada formulir.</span>
                            </div>
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
              Tindakan ini tidak dapat dibatalkan. Formulir "{formToDelete?.title}" akan dihapus.
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
    </MainLayout>
  );
}
