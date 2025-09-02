
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Sprout, Tag } from 'lucide-react';
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
import { getPrograms, deleteProgram, Program } from '@/app/actions/programs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

const ADMIN_PHONE_NUMBER = '+6285176752610';

export default function AdminProgramsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const fetchedPrograms = await getPrograms();
        setPrograms(fetchedPrograms);
      } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Gagal memuat program",
            description: "Terjadi kesalahan saat mengambil data dari server.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [toast]);

  const handleDeleteClick = (program: Program) => {
    setProgramToDelete(program);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (programToDelete && programToDelete.id) {
        setIsDeleting(programToDelete.id);
        try {
            await deleteProgram(programToDelete.id);
            setPrograms(programs.filter(p => p.id !== programToDelete.id));
            toast({
                title: "Program dihapus!",
                description: `"${programToDelete.title}" telah berhasil dihapus.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Gagal menghapus program",
                description: "Terjadi kesalahan saat mencoba menghapus program ini.",
            });
        } finally {
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setProgramToDelete(null);
        }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Program</h1>
            <p className="text-muted-foreground">Buat, edit, dan hapus program kerja.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
            <Button variant="outline" onClick={() => router.push('/admin/programs/tags')}>
                <Tag className="mr-2 h-4 w-4" /> Kelola Tag
            </Button>
            )}
            <Button onClick={() => router.push('/admin/programs/new')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Buat Program Baru
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal Berakhir</TableHead>
                  <TableHead className="hidden md:table-cell">Tags</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-10">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : programs.length > 0 ? (
                  programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(program.endDate.toDate(), 'dd MMMM yyyy')}
                      </TableCell>
                       <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                            {program.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === program.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/programs/edit/${program.id}`)}>
                              Edit
                            </DropdownMenuItem>
                            {isAdmin && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(program)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                            </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                <Sprout className="h-8 w-8" />
                                <span>Belum ada program.</span>
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
              Tindakan ini tidak dapat dibatalkan. Program
              <span className="font-semibold"> "{programToDelete?.title}" </span>
              akan dihapus secara permanen.
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
