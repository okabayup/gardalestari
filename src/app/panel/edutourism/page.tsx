

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getEduwisataPackages, deleteEduwisataPackage, EduwisataPackage } from '@/app/actions/edutourism';
import { syncShortlinks } from '@/app/actions/shortlinks';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, MoreHorizontal, Trash2, Link as LinkIcon, Plane, RefreshCw, Tags } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
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
import { SHORTLINK_DOMAIN } from '@/lib/definitions';


export default function EduwisataPackagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [packages, setPackages] = useState<EduwisataPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EduwisataPackage | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEduwisataPackages();
      setPackages(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memuat paket eduwisata" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

   const handleDeleteClick = (item: EduwisataPackage) => {
    setItemToDelete(item);
    setShowDeleteAlert(true);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncShortlinks();
      toast({ title: 'Sinkronisasi Selesai', description: result.message });
      fetchPackages();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal melakukan sinkronisasi', description: (error as Error).message });
    } finally {
      setIsSyncing(false);
    }
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(itemToDelete.id);
    try {
      await deleteEduwisataPackage(itemToDelete.id);
      toast({ title: "Paket berhasil dihapus." });
      fetchPackages();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: (error as Error).message });
    } finally {
      setIsDeleting(null);
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  const memoizedColumns = useMemo<ColumnDef<EduwisataPackage>[]>(() => [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Paket" />,
    },
    {
      accessorKey: 'id',
      header: 'ID Paket',
    },
    {
        accessorKey: 'longUrl',
        header: 'URL Halaman',
        cell: ({row}) => {
            const url = `${process.env.NEXT_PUBLIC_BASE_URL}/edutourism/${row.original.id}`;
            return (
                 <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs max-w-[200px] truncate block">
                    {url}
                </a>
            )
        }
    },
    {
        accessorKey: 'shortlinkSlug',
        header: 'Shortlink',
        cell: ({row}) => row.original.shortlinkSlug ? (
            <a href={`${SHORTLINK_DOMAIN}/${row.original.shortlinkSlug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                {`${SHORTLINK_DOMAIN}/${row.original.shortlinkSlug}`} <LinkIcon className="h-3 w-3" />
            </a>
        ) : <span className="text-muted-foreground text-xs">Belum ada</span>
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                    {isDeleting === row.original.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/panel/edutourism/edit/${row.original.id}`)}>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(row.original)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [isDeleting, router]);

  const toolbarButtons = (
     <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/panel/edutourism/addons')}>
          <Tags className="mr-2 h-4 w-4" /> Kelola Add-ons
        </Button>
        <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sinkronisasi Shortlink
        </Button>
        <Button onClick={() => router.push('/panel/edutourism/new')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Buat Paket Baru
        </Button>
     </div>
  );

  return (
      <>
        <div className="space-y-6">
            <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Eduwisata</h1>
            <p className="text-muted-foreground">Kelola semua paket perjalanan dan item tambahan.</p>
            </div>
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>
            ) : (
                <DataTable columns={memoizedColumns} data={packages} placeholder="Cari nama paket..." toolbarButtons={toolbarButtons}/>
            )}
        </div>
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                <AlertDialogDescription>
                Tindakan ini akan menghapus paket <span className="font-semibold">"{itemToDelete?.title}"</span> secara permanen.
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
