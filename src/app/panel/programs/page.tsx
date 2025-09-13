
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Tags } from 'lucide-react';
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
import { getPrograms, deleteProgram, Program } from '@/app/actions/programs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';

export default function AdminProgramsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const canManage = hasPermission('manage_programs');
  const canDelete = hasPermission('delete_programs');

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const fetchedPrograms = await getPrograms();
      setPrograms(fetchedPrograms);
    } catch (error) {
      toast({
          variant: "destructive",
          title: "Gagal memuat program",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = (program: Program) => {
    setProgramToDelete(program);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (programToDelete && programToDelete.id) {
        setIsDeleting(programToDelete.id);
        try {
            await deleteProgram(programToDelete.id);
            toast({ title: "Program telah dihapus." });
            fetchPrograms(); // Re-fetch
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal menghapus program",
                description: (error as Error).message,
            });
        } finally {
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setProgramToDelete(null);
        }
    }
  };
  

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Program</h1>
            <p className="text-muted-foreground">Buat, edit, dan kelola semua program.</p>
          </div>
          {canManage && (
             <Button onClick={() => router.push('/panel/programs/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Buat Program Baru
            </Button>
          )}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Program</CardTitle>
              <CardDescription>Total {programs.length} program ditemukan.</CardDescription>
            </div>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => router.push('/panel/programs/tags')}>
                  <Tags className="mr-2 h-4 w-4" />
                  Kelola Tag
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal Berakhir</TableHead>
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
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
                      <TableCell>
                          <Badge variant={program.category === 'flagship' ? 'default' : 'secondary'}>
                              {program.category === 'flagship' ? 'Unggulan' : 'Berkelanjutan'}
                          </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {program.endDate ? format(new Date(program.endDate), 'dd MMM yyyy', { locale: id }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === program.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManage && (
                              <DropdownMenuItem onClick={() => router.push(`/panel/programs/edit/${program.id}`)}>
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(program)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            Belum ada program yang dibuat.
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
              Tindakan ini akan menghapus program <span className="font-semibold">"{programToDelete?.title}"</span> secara permanen.
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
