
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Sparkles, RefreshCw, Star, Newspaper, Search, CircleDashed, History, ChevronsUpDown, Check, X, Info } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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
            // Silently fail is okay here as it's a secondary check
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
  const { user, hasPermission } = useAuth();
  const [posts, setPosts] = useState<BeritaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BeritaPost | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
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

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRowKeys(prev => 
      checked ? [...prev, id] : prev.filter(key => key !== id)
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedRowKeys(checked ? posts.map(p => p.id!) : []);
  };

  const handleBulkStatusUpdate = async (status: 'published' | 'draft') => {
    if (selectedRowKeys.length === 0) return;
    setIsBulkUpdating(true);
    try {
        await updateBeritaStatusBulk(selectedRowKeys, status);
        toast({ title: 'Status Diperbarui', description: `${selectedRowKeys.length} konten telah diperbarui.`});
        setSelectedRowKeys([]);
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
        // Optionally re-fetch status after a delay
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
        setIsDeleting(postToDelete.id);
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
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setPostToDelete(null);
        }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Konten</h1>
            <p className="text-muted-foreground">Buat, edit, dan kelola semua artikel dan video.</p>
          </div>
          {canManage && (
             <div className="flex gap-2">
                 <Button variant="outline" onClick={() => router.push('/panel/berita/jobs')}>
                    <History className="mr-2 h-4 w-4" />
                    Riwayat Tugas AI
                </Button>
                <Button variant="outline" onClick={() => router.push('/panel/berita/newsroom')}>
                    <Newspaper className="mr-2 h-4 w-4" />
                    AI Newsroom
                </Button>
                <Button onClick={() => router.push('/panel/berita/new')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Buat Konten
                </Button>
            </div>
          )}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
             <div>
                <CardTitle>Daftar Konten</CardTitle>
                <CardDescription>Total {posts.length} konten ditemukan.</CardDescription>
             </div>
             <div className="flex items-center gap-2">
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
                {canManage && (
                    <Button variant="outline" size="sm" onClick={() => router.push('/panel/berita/kategori')}>
                        Kelola Kategori
                    </Button>
                )}
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedRowKeys.length === posts.length && posts.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Pilih semua"
                      />
                   </TableHead>
                  <TableHead>Judul</TableHead>
                   <TableHead>Author</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                   <TableHead>Indeks Google</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow key={post.id} className={cn(post.status === 'draft' && 'bg-muted/30')}>
                      <TableCell>
                          <Checkbox
                            checked={selectedRowKeys.includes(post.id!)}
                            onCheckedChange={(checked) => handleSelectRow(post.id!, !!checked)}
                            aria-label={`Pilih ${post.title}`}
                          />
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        {post.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />}
                        {post.status === 'published' ? (
                            <Link href={`/${post.type === 'video' ? 'video' : 'berita'}/${post.slug}`} target="_blank" className="hover:underline">{post.title}</Link>
                        ) : (
                            <span>{post.title}</span>
                        )}
                      </TableCell>
                       <TableCell className="text-xs text-muted-foreground">{post.author}</TableCell>
                      <TableCell><Badge variant="outline">{post.type}</Badge></TableCell>
                      <TableCell>
                         <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status === 'published' ? 'Diterbitkan' : 'Draf'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          {post.status === 'published' && <IndexingStatusBadge post={post} />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === post.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManage && (
                                <>
                                <DropdownMenuItem onClick={() => router.push(`/panel/berita/edit/${post.slug}`)}>
                                Edit
                                </DropdownMenuItem>
                                {post.status === 'published' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleCheckIndexStatus(post.slug, post.type)}>
                                        <Search className="mr-2 h-4 w-4" />
                                        Cek Status Indeks
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleReindexClick(post.slug, post.type)} disabled={isReindexing === post.slug}>
                                        {isReindexing === post.slug ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Minta Indeks Ulang
                                    </DropdownMenuItem>
                                  </>
                                )}
                                </>
                            )}
                            {canDelete && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(post)}>
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
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            Belum ada konten.
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
