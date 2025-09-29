'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getRedeemableItems, createRedeemableItem, updateRedeemableItem, deleteRedeemableItem, RedeemableItem } from '@/app/actions/points';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, PlusCircle, Edit, ShoppingBag, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  pointsRequired: z.coerce.number().min(1, 'Poin harus lebih dari 0'),
  stock: z.coerce.number().min(0, 'Stok tidak boleh negatif'),
  imageFile: z.any().optional(),
});
type FormData = z.infer<typeof formSchema>;

const ItemFormDialog = ({ item, onSave, isSaving, onClose }: { item?: RedeemableItem | null; onSave: (data: FormData, imageFile?: File) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: item || { name: '', description: '', pointsRequired: 10, stock: 0 },
  });
  
  const [preview, setPreview] = useState(item?.imageUrl || null);
  const imageFile = watch('imageFile');

  useEffect(() => {
    if (item) {
        reset(item);
        setPreview(item.imageUrl || null);
    } else {
        reset({ name: '', description: '', pointsRequired: 10, stock: 0 });
        setPreview(null);
    }
  }, [item, reset]);
  
  useEffect(() => {
    if (imageFile && imageFile[0]) {
      setPreview(URL.createObjectURL(imageFile[0]));
    }
  }, [imageFile]);

  const handleFormSubmit = (data: FormData) => {
    onSave(data, data.imageFile?.[0]);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Tambah Item Baru'}</DialogTitle>
          <DialogDescription>Isi detail item yang dapat ditukar dengan Poin Hijau.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Item</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pointsRequired">Poin Dibutuhkan</Label>
              <Input id="pointsRequired" type="number" {...register('pointsRequired')} />
              {errors.pointsRequired && <p className="text-sm text-destructive">{errors.pointsRequired.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stok</Label>
              <Input id="stock" type="number" {...register('stock')} />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageFile">Gambar Item</Label>
            {preview && <Image src={preview} alt="preview" width={100} height={100} className="rounded-md border object-cover"/>}
            <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
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

export default function RedeemItemsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<RedeemableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RedeemableItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RedeemableItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedItems = await getRedeemableItems();
      setItems(fetchedItems);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat item' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: FormData, imageFile?: File) => {
    setIsSaving(true);
    try {
      if (selectedItem?.id) {
        await updateRedeemableItem(selectedItem.id, data, imageFile);
        toast({ title: 'Item berhasil diperbarui!' });
      } else {
        await createRedeemableItem(data, imageFile);
        toast({ title: 'Item baru berhasil ditambahkan!' });
      }
      fetchItems();
      setIsDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
      if (itemToDelete?.id) {
          try {
              await deleteRedeemableItem(itemToDelete.id);
              toast({title: "Item dihapus"});
              fetchItems();
          } catch(error) {
              toast({variant: 'destructive', title: "Gagal menghapus item"});
          } finally {
              setItemToDelete(null);
          }
      }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Item Hadiah</h1>
          <p className="text-muted-foreground">Kelola item yang dapat ditukar dengan Poin Hijau.</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item Baru
        </Button>
      </div>

      {isDialogOpen && <ItemFormDialog item={selectedItem} onSave={handleSave} isSaving={isSaving} onClose={() => setIsDialogOpen(false)} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Item Hadiah</CardTitle>
          <CardDescription>Total {items.length} item tersedia untuk penukaran.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <Card key={item.id} className="flex flex-col">
                  {item.imageUrl && <div className="relative h-32 w-full"><Image src={item.imageUrl} alt={item.name} fill className="object-cover rounded-t-lg"/></div>}
                  <div className="p-4 flex flex-col flex-grow">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground flex-grow mt-1">{item.description}</p>
                      <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-1 font-bold text-primary"><Coins className="h-4 w-4"/> {item.pointsRequired}</div>
                          <div className="text-sm text-muted-foreground">Stok: {item.stock}</div>
                      </div>
                  </div>
                  <div className="p-2 border-t flex gap-2">
                       <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedItem(item); setIsDialogOpen(true); }}><Edit className="h-3 w-3 mr-1"/> Edit</Button>
                       <Button variant="destructive" size="sm" className="w-full" onClick={() => setItemToDelete(item)}><Trash2 className="h-3 w-3 mr-1"/> Hapus</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <ShoppingBag className="mx-auto h-8 w-8 mb-2" />
                Belum ada item hadiah yang dibuat.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item Ini?</AlertDialogTitle>
            <AlertDialogDescription>Anda akan menghapus item "{itemToDelete?.name}". Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
