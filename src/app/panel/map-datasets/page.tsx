
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
import { getMapDatasets, deleteMapDataset, MapDataset } from '@/app/actions/map-datasets';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminMapDatasetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<MapDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MapDataset | null>(null);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getMapDatasets();
      setDatasets(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memuat dataset peta" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (item: MapDataset) => {
    setItemToDelete(item);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(itemToDelete.id);
    try {
      await deleteMapDataset(itemToDelete.id);
      toast({ title: "Dataset peta berhasil dihapus." });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: (error as Error).message });
    } finally {
      setIsDeleting(null);
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Dataset Peta</h1>
            <p className="text-muted-foreground">Kelola sumber data eksternal (GeoJSON) untuk ditampilkan di peta.</p>
          </div>
          <Button onClick={() => router.push('/panel/map-datasets/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Dataset
          </Button>
        </div>
        <Card>
          <CardHeader>
             <CardTitle>Daftar Dataset</CardTitle>
             <CardDescription>Total {datasets.length} dataset ditemukan.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dataset</TableHead>
                  <TableHead>URL Sumber</TableHead>
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
                ) : datasets.length > 0 ? (
                  datasets.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Link href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate">
                            {item.url}
                        </Link>
                      </TableCell>
                       <TableCell>
                        <Badge variant={item.isVisible ? 'default' : 'outline'}>{item.isVisible ? 'Terlihat' : 'Tersembunyi'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/panel/map-datasets/edit/${item.id}`)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(item)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Belum ada dataset yang ditambahkan.
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
              Tindakan ini akan menghapus dataset <span className="font-semibold">"{itemToDelete?.name}"</span> secara permanen.
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
