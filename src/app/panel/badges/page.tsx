
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getBadges, createBadge, deleteBadge, Badge } from '@/app/actions/badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, PlusCircle, Award, MoreHorizontal } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as LucideIcons from 'lucide-react';

const allIcons = Object.keys(LucideIcons).filter(key => key !== 'createReactComponent' && key !== 'LucideIcon');

const formSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  icon: z.string().min(1, 'Ikon wajib dipilih'),
});
type FormData = z.infer<typeof formSchema>;

const IconPicker = ({ onSelect }: { onSelect: (iconName: string) => void }) => {
    return (
        <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border p-2 rounded-md">
            {allIcons.map(iconName => {
                const IconComponent = (LucideIcons as any)[iconName];
                return (
                    <Button key={iconName} variant="ghost" size="icon" onClick={() => onSelect(iconName)} title={iconName}>
                        <IconComponent className="h-5 w-5" />
                    </Button>
                )
            })}
        </div>
    )
}

const NewBadgeDialog = ({ onSave, isSaving }: { onSave: (data: FormData) => void, isSaving: boolean }) => {
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { icon: 'Award' }
    });
    const selectedIcon = watch('icon');
    const IconComponent = (LucideIcons as any)[selectedIcon];
    
    return (
         <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Tambah Lencana Baru</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lencana Baru</DialogTitle>
                    <DialogDescription>
                        Buat lencana pencapaian baru yang bisa diberikan kepada anggota.
                    </DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lencana</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea id="description" {...register('description')} placeholder="Jelaskan kriteria untuk mendapatkan lencana ini."/>
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>Ikon Lencana</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 border rounded-md flex items-center justify-center bg-muted">
                                {IconComponent && <IconComponent className="h-8 w-8 text-primary" />}
                            </div>
                            <Controller name="icon" control={control} render={({ field }) => (
                                <IconPicker onSelect={field.onChange} />
                            )} />
                        </div>
                         {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Simpan Lencana
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export default function BadgesPage() {
  const { toast } = useToast();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Badge | null>(null);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedBadges = await getBadges();
      setBadges(fetchedBadges);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat lencana' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const handleCreate = async (data: FormData) => {
    setIsSaving(true);
    try {
      await createBadge(data);
      toast({ title: 'Lencana berhasil ditambahkan!' });
      fetchBadges();
      return true; // Close dialog
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (itemToDelete && itemToDelete.id) {
      try {
        await deleteBadge(itemToDelete.id);
        toast({ title: 'Lencana dihapus!' });
        fetchBadges();
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
              <h1 className="font-headline text-2xl font-bold">Manajemen Lencana</h1>
              <p className="text-muted-foreground">Buat dan kelola lencana pencapaian untuk anggota.</p>
          </div>
           <NewBadgeDialog onSave={handleCreate} isSaving={isSaving} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lencana</CardTitle>
          <CardDescription>Total {badges.length} lencana tersedia.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map((badge) => {
                const IconComponent = (LucideIcons as any)[badge.icon];
                return (
                    <Card key={badge.id} className="text-center p-4 flex flex-col items-center">
                        {IconComponent && <IconComponent className="h-10 w-10 text-primary mb-2" />}
                        <p className="font-bold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground flex-grow mt-1">{badge.description}</p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="mt-2"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setItemToDelete(badge)}>Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Card>
                )
              })}
            </div>
          ) : (
             <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                Belum ada lencana yang dibuat.
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
              <AlertDialogDescription>
                Lencana <span className="font-semibold">"{itemToDelete?.name}"</span> akan dihapus. Ini tidak akan menghapusnya dari pengguna yang sudah memilikinya.
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
