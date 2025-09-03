
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
import { getEvents, deleteEvent, Event } from '@/app/actions/events';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const canManage = hasPermission('manage_events');
  const canDelete = hasPermission('delete_events');

  const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Gagal memuat acara",
        });
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete && eventToDelete.id) {
        setIsDeleting(eventToDelete.id);
        try {
            await deleteEvent(eventToDelete.id);
            toast({ title: "Acara telah dihapus." });
            fetchEvents();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal menghapus acara",
                description: (error as Error).message,
            });
        } finally {
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setEventToDelete(null);
        }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Acara</h1>
            <p className="text-muted-foreground">Buat, edit, dan kelola semua acara.</p>
          </div>
          {canManage && (
            <Button onClick={() => router.push('/panel/events/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Buat Acara Baru
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
             <CardTitle>Daftar Acara</CardTitle>
             <CardDescription>Total {events.length} acara ditemukan.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="hidden md:table-cell">Lokasi</TableHead>
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
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(event.date.toDate(), 'dd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell className="hidden md:table-cell">{event.location}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === event.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManage && (
                              <DropdownMenuItem onClick={() => router.push(`/panel/events/edit/${event.id}`)}>
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(event)}>
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
                            Belum ada acara yang dibuat.
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
              Tindakan ini akan menghapus acara <span className="font-semibold">"{eventToDelete?.title}"</span> secara permanen.
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
