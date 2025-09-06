
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getVotingTopics, deleteVotingTopic, VotingTopic } from '@/app/actions/voting';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusCircle, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

export default function AdminEVotingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [topics, setTopics] = useState<VotingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VotingTopic | null>(null);

  const canManage = hasPermission('manage_evoting');

  useEffect(() => {
    fetchTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const data = await getVotingTopics();
      setTopics(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat topik E-Voting' });
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (topic: VotingTopic) => {
    const now = Timestamp.now();
    if (now < topic.startDate) return { text: 'Akan Datang', color: 'bg-blue-500' };
    if (now > topic.endDate) return { text: 'Selesai', color: 'bg-gray-500' };
    return { text: 'Aktif', color: 'bg-green-500' };
  };

  const handleDeleteClick = (topic: VotingTopic) => {
    setItemToDelete(topic);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(itemToDelete.id);
    try {
      await deleteVotingTopic(itemToDelete.id);
      toast({ title: 'Topik berhasil dihapus.' });
      fetchTopics();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
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
            <h1 className="font-headline text-2xl font-bold">Manajemen E-Voting</h1>
            <p className="text-muted-foreground">Buat dan kelola topik pemungutan suara.</p>
          </div>
          {canManage && (
            <Button onClick={() => router.push('/panel/evoting/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Topik Baru
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Topik Voting</CardTitle>
            <CardDescription>Total {topics.length} topik ditemukan.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Total Suara</TableHead>
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : topics.length > 0 ? (
                  topics.map((item) => {
                    const status = getStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.text}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(item.startDate.toDate(), 'dd/MM/yy')} - {format(item.endDate.toDate(), 'dd/MM/yy')}
                        </TableCell>
                         <TableCell className="text-right">{item.totalVotes.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                                {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/evoting/${item.id}`)}>Lihat Hasil</DropdownMenuItem>
                               {canManage && (
                                <>
                                    <DropdownMenuItem onClick={() => router.push(`/panel/evoting/edit/${item.id}`)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(item)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                    </DropdownMenuItem>
                                </>
                               )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Belum ada topik E-Voting.
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
              Tindakan ini akan menghapus topik <span className="font-semibold">"{itemToDelete?.title}"</span> dan semua suara terkait secara permanen.
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
