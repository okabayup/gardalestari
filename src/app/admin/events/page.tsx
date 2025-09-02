
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Calendar } from 'lucide-react';
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
import { getEvents, deleteEvent, Event } from '@/app/actions/events';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

const ADMIN_PHONE_NUMBER = '+6285176752610';

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  
  const isAdmin = user?.phoneNumber === ADMIN_PHONE_NUMBER;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Gagal memuat acara",
            description: "Terjadi kesalahan saat mengambil data dari server.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [toast]);

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete && eventToDelete.id) {
        setIsDeleting(eventToDelete.id);
        try {
            await deleteEvent(eventToDelete.id);
            setEvents(events.filter(p => p.id !== eventToDelete.id));
            toast({
                title: "Acara dihapus!",
                description: `"${eventToDelete.title}" telah berhasil dihapus.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Gagal menghapus acara",
                description: "Terjadi kesalahan saat mencoba menghapus acara ini.",
            });
        } finally {
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setEventToDelete(null);
        }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Acara</h1>
            <p className="text-muted-foreground">Buat, edit, dan hapus acara.</p>
          </div>
          <Button onClick={() => router.push('/admin/events/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Acara Baru
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="hidden md:table-cell">Lokasi</TableHead>
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
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(event.date.toDate(), 'dd MMMM yyyy')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{event.location}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === event.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/events/edit/${event.id}`)}>
                              Edit
                            </DropdownMenuItem>
                            {isAdmin && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(event)}>
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
                                <Calendar className="h-8 w-8" />
                                <span>Belum ada acara.</span>
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
              Tindakan ini tidak dapat dibatalkan. Acara
              <span className="font-semibold"> "{eventToDelete?.title}" </span>
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
