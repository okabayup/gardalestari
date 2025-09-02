
'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, Tag, Plus } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from 'next/navigation';
import { getProgramTags, addProgramTag, deleteProgramTag, ProgramTag } from '@/app/actions/programs';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function AdminTagsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tags, setTags] = useState<ProgramTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<ProgramTag | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const fetchedTags = await getProgramTags();
      setTags(fetchedTags);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal memuat tag",
        description: "Terjadi kesalahan saat mengambil data dari server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [toast]);

  const handleDeleteClick = (tag: ProgramTag) => {
    setTagToDelete(tag);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (tagToDelete && tagToDelete.id) {
      setIsDeleting(tagToDelete.id);
      try {
        await deleteProgramTag(tagToDelete.id);
        setTags(tags.filter(t => t.id !== tagToDelete.id));
        toast({
          title: "Tag dihapus!",
          description: `Tag "${tagToDelete.name}" telah berhasil dihapus.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Gagal menghapus tag",
          description: "Terjadi kesalahan saat mencoba menghapus tag ini.",
        });
      } finally {
        setIsDeleting(null);
        setShowDeleteAlert(false);
        setTagToDelete(null);
      }
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
        toast({ variant: "destructive", title: "Nama tag tidak boleh kosong."});
        return;
    }
    setIsAdding(true);
    try {
        await addProgramTag(newTagName.trim());
        toast({ title: "Tag ditambahkan!" });
        setNewTagName('');
        setIsAddDialogOpen(false);
        await fetchTags(); // Refresh list
    } catch (error) {
        toast({
          variant: "destructive",
          title: "Gagal menambahkan tag",
          description: (error as Error).message,
        });
    } finally {
        setIsAdding(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Tag Program</h1>
            <p className="text-muted-foreground">Tambah atau hapus tag yang tersedia untuk program.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Tag Baru
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Tag Baru</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        placeholder="Nama tag..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleAddTag} disabled={isAdding}>
                        {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Tag</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            disabled={isDeleting === tag.id}
                            onClick={() => handleDeleteClick(tag)}
                        >
                            {isDeleting === tag.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                            <span className="sr-only">Hapus tag</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">
                       <div className="flex flex-col items-center gap-2">
                            <Tag className="h-8 w-8" />
                            <span>Belum ada tag.</span>
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
            <AlertDialogTitle>Anda yakin ingin menghapus tag ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Tag "{tagToDelete?.name}" akan dihapus.
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
