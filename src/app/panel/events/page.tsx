
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
import { getEvents, deleteEvent, Event } from '@/app/actions/events';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const canManage = hasPermission('manage_events');
  const canDelete = hasPermission('delete_events');

  const fetchEvents = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete && eventToDelete.id) {
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
            setShowDeleteAlert(false);
            setEventToDelete(null);
        }
    }
  };

  const memoizedColumns = useMemo<ColumnDef<Event>[]>(() => [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
      cell: ({ row }) => format(new Date(row.original.startDate), 'dd MMM yyyy')
    },
    {
      accessorKey: 'location',
      header: "Lokasi",
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
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
        );
      }
    }
  ], [canManage, canDelete, router]);

  const toolbarButtons = (
     <>
      {canManage && (
        <Button onClick={() => router.push('/panel/events/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Acara Baru
        </Button>
      )}
     </>
  );
  
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Acara</h1>
          <p className="text-muted-foreground">Buat, edit, dan kelola semua acara.</p>
        </div>
        {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
            <DataTable columns={memoizedColumns} data={events} placeholder="Cari judul acara..." toolbarButtons={toolbarButtons}/>
        )}
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
