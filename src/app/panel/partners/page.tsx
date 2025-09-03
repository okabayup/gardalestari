
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
import { getPartners, deletePartner, Partner } from '@/app/actions/partners';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function AdminPartnersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  const fetchPartners = async () => {
      setLoading(true);
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
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleDeleteClick = (partner: Partner) => {
    setPartnerToDelete(partner);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (partnerToDelete && partnerToDelete.id) {
        setIsDeleting(partnerToDelete.id);
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
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setPartnerToDelete(null);
        }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Mitra</h1>
            <p className="text-muted-foreground">Kelola semua mitra strategis Garda Lestari.</p>
          </div>
          <Button onClick={() => router.push('/panel/partners/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Mitra Baru
          </Button>
        </div>
        <Card>
          <CardHeader>
             <CardTitle>Daftar Mitra</CardTitle>
             <CardDescription>Total {partners.length} mitra ditemukan.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Mitra</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : partners.length > 0 ? (
                  partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={partner.logoUrl} alt={partner.name} />
                            <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {partner.name}
                      </TableCell>
                      <TableCell>
                        <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {partner.websiteUrl}
                        </a>
                      </TableCell>
                       <TableCell>
                          {partner.isFeatured && <Badge>Utama</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === partner.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/panel/partners/edit/${partner.id}`)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(partner)}>
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
                            Belum ada mitra yang ditambahkan.
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
