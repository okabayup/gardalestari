
'use client';

import { Button } from '@/components/ui/button';
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
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getPrograms, deleteProgram, Program } from '@/app/actions/programs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Tags } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';

export default function AdminProgramsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const canManage = hasPermission('manage_programs');
  const canDelete = hasPermission('delete_programs');

  const fetchPrograms = useCallback(async () => {
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
  }, [toast]);
  
  useEffect(() => {
    setLoading(true);
    fetchPrograms();
  }, [fetchPrograms]);

  const handleDeleteClick = (program: Program) => {
    setProgramToDelete(program);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (programToDelete && programToDelete.id) {
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
            setShowDeleteAlert(false);
            setProgramToDelete(null);
        }
    }
  };

  const memoizedColumns = useMemo<ColumnDef<Program>[]>(() => [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ row }) => <Badge variant={row.original.category === 'flagship' ? 'default' : 'secondary'}>{row.original.category === 'flagship' ? 'Unggulan' : 'Berkelanjutan'}</Badge>
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Berakhir" />,
      cell: ({ row }) => row.original.endDate ? format(new Date(row.original.endDate!), 'dd MMM yyyy', { locale: id }) : 'Tak Terbatas'
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const program = row.original;
        return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
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
        );
      }
    }
  ], [canManage, canDelete, router]);

   const toolbarButtons = (
    <div className="flex gap-2">
      {canManage && (
        <>
          <Button variant="outline" size="sm" onClick={() => router.push('/panel/programs/tags')}>
              <Tags className="mr-2 h-4 w-4" />
              Kelola Tag
          </Button>
          <Button onClick={() => router.push('/panel/programs/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Program Baru
          </Button>
        </>
      )}
    </div>
  );
  
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Program</h1>
          <p className="text-muted-foreground">Buat, edit, dan kelola semua program.</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <DataTable columns={memoizedColumns} data={programs} placeholder="Cari judul program..." toolbarButtons={toolbarButtons}/>
        )}
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
