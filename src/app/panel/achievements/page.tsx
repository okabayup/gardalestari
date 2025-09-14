
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
import { getAchievements, deleteAchievement, Achievement } from '@/app/actions/achievements';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

export default function AdminAchievementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Achievement | null>(null);
  
  const canManage = hasPermission('manage_achievements');

  useEffect(() => {
    fetchAchievements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const data = await getAchievements();
      setAchievements(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memuat prestasi" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (item: Achievement) => {
    setItemToDelete(item);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(itemToDelete.id);
    try {
      await deleteAchievement(itemToDelete.id);
      toast({ title: "Prestasi berhasil dihapus." });
      fetchAchievements();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: (error as Error).message });
    } finally {
      setIsDeleting(null);
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  const formatDate = async (date: string) => {
    const { id } = await import('date-fns/locale/id');
    return format(new Date(date), 'dd MMM yyyy', { locale: id });
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Prestasi</h1>
            <p className="text-muted-foreground">Catat dan kelola pencapaian gemilang anggota.</p>
          </div>
          {canManage && (
            <Button onClick={() => router.push('/panel/achievements/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Prestasi
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
             <CardTitle>Daftar Prestasi</CardTitle>
             <CardDescription>Total {achievements.length} prestasi ditemukan.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Judul Prestasi</TableHead>
                  <TableHead>Tanggal</TableHead>
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
                ) : achievements.length > 0 ? (
                  achievements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={item.userAvatar} />
                            <AvatarFallback>{item.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {item.userName}
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                          <ClientFormattedDate date={item.date} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                                {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/panel/achievements/edit/${item.id}`)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(item)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Belum ada prestasi yang ditambahkan.
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
              Tindakan ini akan menghapus prestasi <span className="font-semibold">"{itemToDelete?.title}"</span> secara permanen.
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

// Client-side component to handle date formatting
function ClientFormattedDate({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const formatDate = async () => {
      const { id } = await import('date-fns/locale/id');
      setFormattedDate(format(new Date(date), 'dd MMM yyyy', { locale: id }));
    };
    formatDate();
  }, [date]);

  return <>{formattedDate || 'Memuat...'}</>;
}
