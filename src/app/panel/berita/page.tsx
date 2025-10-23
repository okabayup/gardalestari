
'use client';

import { Button } from '@/components/ui/button';
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
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getBeritaPosts, deleteBeritaPost, requestReindexing, updateBeritaStatusBulk, getNotificationStatus } from '@/app/actions/berita';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import type { BeritaPost, IndexingStatus } from '@/lib/definitions';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/panel/DataTable';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
import { Loader2, PlusCircle, MoreHorizontal, Trash2, Sparkles, RefreshCw, Star, Newspaper, Search, CircleDashed, History, ChevronsUpDown, Check, X, Info, Tags } from 'lucide-react';


const IndexingStatusBadge = ({ post }: { post: BeritaPost }) => {
    const [status, setStatus] = useState<IndexingStatus | null | undefined>(post.indexingStatus);
    const [loading, setLoading] = useState(false);

    const handleFetchStatus = useCallback(async () => {
        if (post.status !== 'published') return;
        setLoading(true);
        try {
            const fetchedStatus = await getNotificationStatus(post.slug);
            setStatus(fetchedStatus);
        } catch (error) {
            console.error("Failed to fetch notification status:", error);
        } finally {
            setLoading(false);
        }
    }, [post.status, post.slug]);
    
    const latestNotification = status?.latestUpdate?.notifyTime ? status.latestUpdate : status?.latestRemove;

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (!latestNotification) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Badge variant="outline" className="cursor-pointer" onClick={handleFetchStatus}>
                            <CircleDashed className="h-3 w-3" />
                         </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Status tidak diketahui. Klik untuk memeriksa.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
           
        );
    }
    
    const timeAgo = formatDistanceToNow(new Date(latestNotification.notifyTime), { addSuffix: true, locale: id });
    const isUpdate = latestNotification.type === 'URL_UPDATED';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant={isUpdate ? 'default' : 'destructive'} className="cursor-pointer" onClick={handleFetchStatus}>
                        {isUpdate ? 'Updated' : 'Deleted'}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Google terakhir diberitahu {timeAgo}.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


export default function AdminBeritaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [posts, setPosts] = useState<BeritaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReindexing, setIsReindexing] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BeritaPost | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const canManage = hasPermission('manage_news');
  const canDelete = hasPermission('delete_news');

  const fetchPosts = useCallback(async () => {
    try {
      const fetchedPosts = await getBeritaPosts(undefined, true);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error(error);
      toast({
          variant: "destructive",
          title: "Gagal memuat berita",
          description: "Terjadi kesalahan saat mengambil data dari server.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  const selectedRowKeys = Object.keys(rowSelection);

  const handleBulkStatusUpdate = async (status: 'published' | 'draft') => {
    if (selectedRowKeys.length === 0) return;
    setIsBulkUpdating(true);
    try {
        await updateBeritaStatusBulk(selectedRowKeys, status);
        toast({ title: 'Status Diperbarui', description: `${selectedRowKeys.length} konten telah diperbarui.`});
        setRowSelection({});
        fetchPosts();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal Memperbarui', description: (error as Error).message });
    } finally {
        setIsBulkUpdating(false);
    }
  }

  const handleDeleteClick = (post: BeritaPost) => {
    setPostToDelete(post);
    setShowDeleteAlert(true);
  };

  const handleReindexClick = async (slug: string, type: 'artikel' | 'video' = 'artikel') => {
    setIsReindexing(slug);
    try {
        const result = await requestReindexing(slug, type);
        toast({ title: "Sukses", description: result.message });
        setTimeout(() => fetchPosts(), 2000);
    } catch (error) {
         toast({ variant: "destructive", title: "Gagal", description: (error as Error).message });
    } finally {
        setIsReindexing(null);
    }
  }
  
  const handleCheckIndexStatus = (slug: string, type: 'artikel' | 'video' = 'artikel') => {
    const siteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${type === 'video' ? 'video' : 'berita'}/${slug}`;
    const searchConsoleUrl = `https://search.google.com/search-console/inspect?resource_id=sc-domain:${new URL(siteUrl).hostname}&id=${encodeURIComponent(siteUrl)}`;
    window.open(searchConsoleUrl, '_blank');
  }

  const handleDeleteConfirm = async () => {
    if (postToDelete && postToDelete.id) {
        try {
            await deleteBeritaPost(postToDelete.id);
            setPosts(posts.filter(p => p.id !== postToDelete.id));
            toast({
                title: "Konten dihapus!",
                description: `"${postToDelete.title}" telah berhasil dihapus.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Gagal menghapus",
                description: "Terjadi kesalahan saat mencoba menghapus konten ini.",
            });
        } finally {
            setShowDeleteAlert(false);
            setPostToDelete(null);
        }
    }
  };

   const memoizedColumns = useMemo<ColumnDef<BeritaPost>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Pilih semua"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Pilih baris"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
      cell: ({ row }) => {
        const post = row.original;
        return (
            <div className="font-medium flex items-center gap-2">
                {post.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />}
                {post.status === 'published' ? (
                    <Link href={`/${post.type === 'video' ? 'video' : 'berita'}/${post.slug}`} target="_blank" className="hover:underline">{post.title}</Link>
                ) : (
                    <span>{post.title}</span>
                )}
            </div>
        )
      }
    },
    { accessorKey: "author", header: "Author" },
    { accessorKey: "type", header: "Tipe", cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
        <Badge variant={row.original.status === 'published' ? 'default' : 'secondary'}>
            {row.original.status === 'published' ? 'Diterbitkan' : 'Draf'}
        </Badge>
    )},
    { id: 'indexing', header: 'Indeks Google', cell: ({ row }) => <IndexingStatusBadge post={row.original} /> },
    { accessorKey: 'date', header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />, cell: ({ row }) => new Date(row.original.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })},
    { id: 'actions', cell: ({ row }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            {canManage && (
                <>
                <DropdownMenuItem onClick={() => router.push(`/panel/berita/edit/${row.original.slug}`)}>Edit</DropdownMenuItem>
                {row.original.status === 'published' && (
                  <>
                    <DropdownMenuItem onClick={() => handleCheckIndexStatus(row.original.slug, row.original.type)}>
                        <Search className="mr-2 h-4 w-4" /> Cek Status Indeks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReindexClick(row.original.slug, row.original.type)} disabled={isReindexing === row.original.slug}>
                        {isReindexing === row.original.slug ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Minta Indeks Ulang
                    </DropdownMenuItem>
                  </>
                )}
                </>
            )}
            {canDelete && (
                <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(row.original)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
                </>
            )}
            </DropdownMenuContent>
        </DropdownMenu>
    )},
  ], [canDelete, canManage, isReindexing, router]);

  const toolbarButtons = (
     <div className="flex gap-2">
        {selectedRowKeys.length > 0 && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isBulkUpdating}>
                        {isBulkUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ChevronsUpDown className="mr-2 h-4 w-4" />}
                        Ubah Status ({selectedRowKeys.length})
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('published')}><Check className="mr-2 h-4 w-4" /> Terbitkan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('draft')}><X className="mr-2 h-4 w-4" /> Jadikan Draf</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
        <Button variant="outline" size="sm" onClick={() => router.push('/panel/berita/kategori')}><Tags className="mr-2 h-4 w-4"/>Kelola Kategori</Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/panel/berita/jobs')}><History className="mr-2 h-4 w-4"/>Riwayat Tugas AI</Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/panel/berita/newsroom')}><Newspaper className="mr-2 h-4 w-4"/>AI Newsroom</Button>
        <Button onClick={() => router.push('/panel/berita/new')}><PlusCircle className="mr-2 h-4 w-4"/>Buat Konten</Button>
     </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Konten</h1>
          <p className="text-muted-foreground">Buat, edit, dan kelola semua artikel dan video.</p>
        </div>
        
        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>
        ) : (
           <DataTable 
             columns={memoizedColumns} 
             data={posts} 
             rowSelection={rowSelection}
             setRowSelection={setRowSelection}
             placeholder="Cari judul..."
             toolbarButtons={toolbarButtons}
           />
        )}
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Konten
              <span className="font-semibold"> "{postToDelete?.title}" </span>
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
    </>
  );
}
