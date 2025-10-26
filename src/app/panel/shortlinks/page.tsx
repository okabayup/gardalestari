'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getShortLinks, createShortLink, deleteShortLink, ShortLink, updateShortLink } from '@/app/actions/shortlinks';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Trash2, Link as LinkIcon, MoreHorizontal, Edit } from 'lucide-react';
import { DataTable } from '@/components/panel/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SHORTLINK_DOMAIN } from '@/lib/definitions';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';


const formSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  slug: z.string().min(3, "Slug minimal 3 karakter").regex(/^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
  longUrl: z.string().url("URL tidak valid"),
});
type FormData = z.infer<typeof formSchema>;

const ShortlinkDialog = ({
    link,
    onSave, 
    isSaving 
}: { 
    link?: ShortLink | null,
    onSave: (data: FormData, id?: string) => Promise<boolean>, 
    isSaving: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ 
      resolver: zodResolver(formSchema),
      defaultValues: link || undefined,
  });

  useEffect(() => {
    if (isOpen) {
        reset(link || { title: '', slug: '', longUrl: '' });
    }
  }, [isOpen, link, reset]);
  
  const handleFormSubmit = async (data: FormData) => {
    const success = await onSave(data, link?.id);
    if (success) {
      reset();
      setIsOpen(false);
    }
  }

  const dialogTrigger = link ? (
     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
  ) : (
     <Button><PlusCircle className="mr-2 h-4 w-4" /> Buat Shortlink</Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            {dialogTrigger}
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{link ? 'Edit Shortlink' : 'Buat Shortlink Baru'}</DialogTitle>
                <DialogDescription>{link ? 'Perbarui detail untuk tautan ini.' : `Buat tautan pendek baru dengan domain ${SHORTLINK_DOMAIN}.`}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Judul</Label>
                    <Input id="title" {...register('title')} placeholder="Contoh: Link Pendaftaran Acara" />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug Kustom</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{SHORTLINK_DOMAIN}/</span>
                        <Input id="slug" {...register('slug')} placeholder="acara-nasional" />
                    </div>
                    {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="longUrl">URL Tujuan (Panjang)</Label>
                    <Input id="longUrl" type="url" {...register('longUrl')} placeholder="https://..." />
                    {errors.longUrl && <p className="text-sm text-destructive">{errors.longUrl.message}</p>}
                </div>
                 <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  )
}

export default function ShortlinksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ShortLink | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShortLinks();
      setLinks(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memuat shortlink" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleSave = async (data: FormData, id?: string) => {
    setIsSaving(true);
    try {
      if (id) {
        await updateShortLink(id, { ...data, type: 'custom' });
        toast({ title: "Shortlink berhasil diperbarui!" });
      } else {
        await createShortLink({ ...data, type: 'custom' });
        toast({ title: "Shortlink berhasil dibuat!" });
      }
      fetchLinks();
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: (error as Error).message });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

   const handleDeleteClick = (item: ShortLink) => {
    setItemToDelete(item);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    try {
      await deleteShortLink(itemToDelete.id);
      toast({ title: "Shortlink berhasil dihapus." });
      fetchLinks();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: (error as Error).message });
    } finally {
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  const memoizedColumns = useMemo<ColumnDef<ShortLink>[]>(() => [
    {
      accessorKey: 'slug',
      header: 'Shortlink',
      cell: ({ row }) => (
          <a href={`${SHORTLINK_DOMAIN}/${row.original.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              {`${SHORTLINK_DOMAIN}/${row.original.slug}`} <LinkIcon className="h-3 w-3" />
          </a>
      )
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
    },
    {
      accessorKey: 'longUrl',
      header: 'URL Asli',
      cell: ({ row }) => <p className="max-w-xs truncate">{row.original.longUrl}</p>
    },
    {
        accessorKey: 'clicks',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Klik" />,
        cell: ({ row }) => row.original.clicks.toLocaleString('id-ID')
    },
    {
      id: 'actions',
      cell: ({ row }) => {
          const link = row.original;
          return (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <ShortlinkDialog link={link} onSave={handleSave} isSaving={isSaving} />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(link)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          )
      }
    },
  ], [isSaving]);

  const toolbarButtons = (
     <ShortlinkDialog onSave={handleSave} isSaving={isSaving} />
  );

  return (
      <>
        <div className="space-y-6">
            <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Shortlink</h1>
            <p className="text-muted-foreground">Kelola semua tautan pendek dengan domain {SHORTLINK_DOMAIN}.</p>
            </div>
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>
            ) : (
                <DataTable columns={memoizedColumns} data={links} placeholder="Cari judul atau slug..." toolbarButtons={toolbarButtons}/>
            )}
        </div>
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                <AlertDialogDescription>
                Tindakan ini akan menghapus shortlink <span className="font-semibold">"{itemToDelete?.slug}"</span> secara permanen.
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
