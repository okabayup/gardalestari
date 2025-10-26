
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getAddons, createAddon, updateAddon, deleteAddon, Addon } from '@/app/actions/edutourism';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, PlusCircle, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const addonSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  stock: z.coerce.number().min(-1, 'Stok minimal -1 (tak terbatas)'),
});

type AddonFormData = z.infer<typeof addonSchema>;

const AddonFormDialog = ({ addon, onSave, isSaving, onClose }: { addon?: Addon | null; onSave: (data: AddonFormData) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    defaultValues: addon || { name: '', description: '', price: 0, stock: -1 },
  });

  useEffect(() => {
    reset(addon || { name: '', description: '', price: 0, stock: -1 });
  }, [addon, reset]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{addon ? 'Edit Add-on' : 'Tambah Add-on Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Add-on</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input id="price" type="number" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stok</Label>
              <Input id="stock" type="number" {...register('stock')} />
              <p className="text-xs text-muted-foreground">Isi -1 untuk stok tak terbatas.</p>
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function AddonsPage() {
  const { toast } = useToast();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Addon | null>(null);

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getAddons();
      setAddons(fetchedData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat add-ons' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleSave = async (data: AddonFormData) => {
    setIsSaving(true);
    try {
      if (selectedAddon?.id) {
        await updateAddon(selectedAddon.id, data);
        toast({ title: 'Add-on berhasil diperbarui!' });
      } else {
        await createAddon(data);
        toast({ title: 'Add-on baru berhasil ditambahkan!' });
      }
      fetchAddons();
      setIsDialogOpen(false);
      setSelectedAddon(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (itemToDelete?.id) {
      try {
        await deleteAddon(itemToDelete.id);
        toast({ title: 'Add-on dihapus!' });
        fetchAddons();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
      } finally {
        setItemToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Add-ons Eduwisata</h1>
          <p className="text-muted-foreground">Kelola item tambahan untuk paket eduwisata.</p>
        </div>
        <Button onClick={() => { setSelectedAddon(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Add-on
        </Button>
      </div>

      {isDialogOpen && <AddonFormDialog addon={selectedAddon} onSave={handleSave} isSaving={isSaving} onClose={() => setIsDialogOpen(false)} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Add-ons</CardTitle>
          <CardDescription>Total {addons.length} item ditemukan.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{item.stock === -1 ? 'Tak Terbatas' : item.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedAddon(item); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {addons.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">Belum ada add-on.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus <span className="font-semibold">"{itemToDelete?.name}"</span>. Ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
