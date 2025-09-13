
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Sparkles, RefreshCw, Star, Newspaper, Search } from 'lucide-react';
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
import { getBeritaPosts, deleteBeritaPost, requestReindexing } from '@/app/actions/berita';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import type { BeritaPost } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminBeritaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [posts, setPosts] = useState<BeritaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BeritaPost | null>(null);

  const canManage = hasPermission('manage_news');
  const canDelete = hasPermission('delete_news');


  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getBeritaPosts();
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
    };
    fetchPosts();
  }, [toast]);
  
  const getSeoBadgeColor = (score: number) => {
    if (score >= 75) return 'bg-green-500 hover:bg-green-500/80';
    if (score >= 50) return 'bg-yellow-500 hover:bg-yellow-500/80';
    return 'bg-red-500 hover:bg-red-500/80';
  };

  const handleDeleteClick = (post: BeritaPost) => {
    setPostToDelete(post);
    setShowDeleteAlert(true);
  };

  const handleReindexClick = async (slug: string, type: 'artikel' | 'video' = 'artikel') => {
    setIsReindexing(slug);
    try {
        const result = await requestReindexing(slug, type);
        toast({ title: "Sukses", description: result.message });
    } catch (error) {
         toast({ variant: "destructive", title: "Gagal", description: (error as Error).message });
    } finally {
        setIsReindexing(null);
    }
  }
  
  const handleCheckIndexStatus = (slug: string, type: 'artikel' | 'video' = 'artikel') => {
    const siteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${type === 'video' ? 'video' : 'berita'}/${slug}`;
    const searchConsoleUrl = `https://search.google.com/search-console/inspect?resource_id=${process.env.NEXT_PUBLIC_BASE_URL}&id=${encodeURIComponent(siteUrl)}`;
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
                <Button variant="outline" onClick={() => router.push('/panel/berita/newsroom')}>
                    <Newspaper className="mr-2 h-4 w-4" />
                    AI Newsroom
                </Button>
                <Button onClick={() => router.push('/panel/berita/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Editor Cerdas
                </Button>
            </div>
          )}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
             <div>
                <CardTitle>Daftar Konten</CardTitle>
                <CardDescription>Total {posts.length} konten dipublikasikan.</CardDescription>
             </div>
             {canManage && (
                <Button variant="outline" size="sm" onClick={() => router.push('/panel/berita/kategori')}>
                    Kelola Kategori
                </Button>
             )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Skor SEO</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {post.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />}
                        <Link href={`/${post.type}/${post.slug}`} target="_blank" className="hover:underline">{post.title}</Link>
                      </TableCell>
                      <TableCell><Badge variant="outline">{post.type}</Badge></TableCell>
                      <TableCell>
                        {post.seoScore ? (
                          <Badge className={cn(getSeoBadgeColor(post.seoScore))}>
                            {post.seoScore}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
                        )}
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
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
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
