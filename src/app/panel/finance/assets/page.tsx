

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getAssets, createAsset, updateAsset, deleteAsset, runMonthlyDepreciation, FixedAsset } from '@/app/actions/assets';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, PlusCircle, Edit, RefreshCw } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const assetSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().optional(),
  acquisitionDate: z.date({ required_error: "Tanggal perolehan wajib diisi" }),
  acquisitionCost: z.coerce.number().min(0, 'Biaya perolehan tidak boleh negatif'),
  usefulLife: z.coerce.number().min(1, 'Umur manfaat minimal 1 tahun'),
  salvageValue: z.coerce.number().min(0, 'Nilai sisa tidak boleh negatif'),
});

type AssetFormData = z.infer<typeof assetSchema>;

const AssetFormDialog = ({ asset, onSave, isSaving, onClose }: { asset?: FixedAsset | null; onSave: (data: AssetFormData) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset ? {
        ...asset,
        acquisitionDate: asset.acquisitionDate.toDate(),
    } : {
        name: '',
        description: '',
        acquisitionDate: new Date(),
        acquisitionCost: 0,
        usefulLife: 5,
        salvageValue: 0
    },
  });

  useEffect(() => {
    reset(asset ? {
        ...asset,
        acquisitionDate: asset.acquisitionDate.toDate(),
    } : {
        name: '',
        description: '',
        acquisitionDate: new Date(),
        acquisitionCost: 0,
        usefulLife: 5,
        salvageValue: 0
    });
  }, [asset, reset]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Aset' : 'Tambah Aset Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Aset</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Perolehan</Label>
              <Controller name="acquisitionDate" control={control} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                </Popover>
              )} />
              {errors.acquisitionDate && <p className="text-sm text-destructive">{errors.acquisitionDate.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="acquisitionCost">Harga Perolehan (Rp)</Label>
              <Input id="acquisitionCost" type="number" {...register('acquisitionCost')} />
              {errors.acquisitionCost && <p className="text-sm text-destructive">{errors.acquisitionCost.message}</p>}
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usefulLife">Umur Manfaat (Tahun)</Label>
              <Input id="usefulLife" type="number" {...register('usefulLife')} />
              {errors.usefulLife && <p className="text-sm text-destructive">{errors.usefulLife.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salvageValue">Nilai Sisa (Rp)</Label>
              <Input id="salvageValue" type="number" {...register('salvageValue')} />
              {errors.salvageValue && <p className="text-sm text-destructive">{errors.salvageValue.message}</p>}
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


export default function AssetsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FixedAsset | null>(null);
  const [isDepreciating, setIsDepreciating] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getAssets();
      setAssets(fetchedData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat aset' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSave = async (data: AssetFormData) => {
    setIsSaving(true);
    const payload = {
        ...data,
        acquisitionDate: Timestamp.fromDate(data.acquisitionDate),
        depreciationMethod: 'straight-line' as const,
    };
    try {
      if (selectedAsset?.id) {
        await updateAsset(selectedAsset.id, payload);
        toast({ title: 'Aset berhasil diperbarui!' });
      } else {
        await createAsset(payload);
        toast({ title: 'Aset baru berhasil ditambahkan!' });
      }
      fetchAssets();
      setIsDialogOpen(false);
      setSelectedAsset(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (itemToDelete?.id) {
      try {
        await deleteAsset(itemToDelete.id);
        toast({ title: 'Aset dihapus!' });
        fetchAssets();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus aset', description: (error as Error).message });
      } finally {
        setItemToDelete(null);
      }
    }
  };
  
  const handleRunDepreciation = async () => {
      if (!user) return;
      setIsDepreciating(true);
      try {
          const result = await runMonthlyDepreciation(user.uid);
          toast({ title: 'Proses Selesai', description: result.message });
          fetchAssets();
      } catch (error) {
           toast({ variant: 'destructive', title: 'Gagal Menjalankan Penyusutan', description: (error as Error).message });
      } finally {
          setIsDepreciating(false);
      }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Aset Tetap</h1>
          <p className="text-muted-foreground">Kelola daftar aset yang dimiliki organisasi.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => { setSelectedAsset(null); setIsDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Aset
            </Button>
            <Button onClick={handleRunDepreciation} disabled={isDepreciating}>
                {isDepreciating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                Jalankan Penyusutan
            </Button>
        </div>
      </div>

      {isDialogOpen && <AssetFormDialog asset={selectedAsset} onSave={handleSave} isSaving={isSaving} onClose={() => setIsDialogOpen(false)} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Aset</CardTitle>
          <CardDescription>Total {assets.length} aset tercatat.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Aset</TableHead>
                  <TableHead>Tgl. Perolehan</TableHead>
                  <TableHead>Harga Perolehan (Rp)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map(asset => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{format(asset.acquisitionDate.toDate(), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-mono">{asset.acquisitionCost.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{asset.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedAsset(asset); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete(asset)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">Belum ada aset yang dicatat.</TableCell>
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
            <AlertDialogTitle>Anda yakin ingin menghapus aset ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Aset <span className="font-semibold">"{itemToDelete?.name}"</span> akan dihapus. Ini tidak dapat dibatalkan.
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
