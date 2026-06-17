
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
import { getPartners, deletePartner, Partner } from '@/app/actions/partners';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
import Link from 'next/link';

export default function AdminPartnersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  const canManage = hasPermission('manage_partners');
  const canDelete = hasPermission('delete_partners');

  const fetchPartners = useCallback(async () => {
    try {
      const fetchedPartners = await getPartners();
      setPartners(fetchedPartners);
    } catch (error) {
      toast({
          variant: "destructive",
          title: "Gagal memuat mitra",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchPartners();
  }, [fetchPartners]);

  const handleDeleteClick = (partner: Partner) => {
    setPartnerToDelete(partner);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (partnerToDelete && partnerToDelete.id) {
        try {
            await deletePartner(partnerToDelete.id);
            toast({ title: "Mitra telah dihapus." });
            fetchPartners();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal menghapus mitra",
                description: (error as Error).message,
            });
        } finally {
            setShowDeleteAlert(false);
            setPartnerToDelete(null);
        }
    }
  };
  
  const memoizedColumns = useMemo<ColumnDef<Partner>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Mitra" />,
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={row.original.logoUrl} alt={row.original.name} />
                <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {row.original.name}
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ row }) => <Badge variant={row.original.category === 'strategis' ? 'default' : 'outline'}>{row.original.category === 'strategis' ? 'Strategis' : 'Media'}</Badge>
    },
    {
      accessorKey: 'websiteUrl',
      header: 'Website',
      cell: ({ row }) => <Link href={row.original.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{row.original.websiteUrl}</Link>
    },
    {
      accessorKey: 'isFeatured',
      header: 'Status',
      cell: ({ row }) => row.original.isFeatured && <Badge>Utama</Badge>
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const partner = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManage && (
                <DropdownMenuItem onClick={() => router.push(`/panel/partners/edit/${partner.id}`)}>
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(partner)}>
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
     <>
      {canManage && (
        <Button onClick={() => router.push('/panel/partners/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Mitra Baru
        </Button>
      )}
     </>
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Mitra</h1>
          <p className="text-muted-foreground">Kelola semua mitra strategis dan media Garda Lestari.</p>
        </div>
         {loading ? (
             <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
         ) : (
            <DataTable columns={memoizedColumns} data={partners} placeholder="Cari nama mitra..." toolbarButtons={toolbarButtons}/>
         )}
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus mitra <span className="font-semibold">"{partnerToDelete?.name}"</span> secara permanen.
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
