
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { 
    getPositions, 
    createPosition, 
    updatePosition,
    deletePosition, 
    Position,
    PermissionId,
    ALL_PERMISSIONS 
} from '@/app/actions/positions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, PlusCircle, Edit, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PositionForm = ({ position, onSave, isSaving }: { position?: Position | null, onSave: (data: Omit<Position, 'id'>) => void, isSaving: boolean }) => {
    const { register, handleSubmit, control, reset, watch } = useForm<Omit<Position, 'id'>>({
        defaultValues: position || { name: '', permissions: [] }
    });

    useEffect(() => {
        reset(position || { name: '', permissions: [] });
    }, [position, reset]);
    
    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nama Jabatan</Label>
                <Input {...register('name', { required: true })} placeholder="Contoh: Ketua Divisi Media" />
            </div>
             <div className="space-y-2">
                <Label>Hak Akses</Label>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {ALL_PERMISSIONS.map(permission => (
                        <Controller
                            key={permission.id}
                            name="permissions"
                            control={control}
                            render={({ field }) => {
                                return (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={permission.id}
                                            checked={field.value.includes(permission.id)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...field.value, permission.id])
                                                : field.onChange(field.value.filter((value) => value !== permission.id));
                                            }}
                                        />
                                        <label htmlFor={permission.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {permission.label}
                                        </label>
                                    </div>
                                )
                            }}
                        />
                    ))}
                    </CardContent>
                </Card>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Simpan
                </Button>
            </DialogFooter>
        </form>
    )
}

export default function PositionsPage() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPositions = await getPositions();
      setPositions(fetchedPositions);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat jabatan' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleSave = async (data: Omit<Position, 'id'>) => {
    setIsSaving(true);
    try {
      if (selectedPosition && selectedPosition.id) {
        await updatePosition(selectedPosition.id, data);
        toast({ title: 'Jabatan berhasil diperbarui!' });
      } else {
        await createPosition(data);
        toast({ title: 'Jabatan berhasil ditambahkan!' });
      }
      setIsDialogOpen(false);
      setSelectedPosition(null);
      fetchPositions();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Anda yakin ingin menghapus jabatan ini?')) {
      try {
        await deletePosition(id);
        toast({ title: 'Jabatan dihapus!' });
        fetchPositions();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
      }
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Jabatan & Hak Akses</h1>
            <p className="text-muted-foreground">Buat dan kelola jabatan serta izin yang terkait.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setSelectedPosition(null);
          }}>
              <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Tambah Jabatan</Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{selectedPosition ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}</DialogTitle>
                      <DialogDescription>
                          Tentukan nama jabatan dan hak akses yang dimilikinya.
                      </DialogDescription>
                  </DialogHeader>
                  <PositionForm position={selectedPosition} onSave={handleSave} isSaving={isSaving} />
              </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Jabatan</CardTitle>
            <CardDescription>Kelola jabatan yang ada.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Jabatan</TableHead>
                    <TableHead>Hak Akses</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium">{pos.name}</TableCell>
                       <TableCell>
                          <span className="text-sm text-muted-foreground">
                              {pos.permissions.length} izin aktif
                          </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => {
                            setSelectedPosition(pos);
                            setIsDialogOpen(true);
                        }}>
                           <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => pos.id && handleDelete(pos.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {positions.length === 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground py-4">Belum ada jabatan yang dibuat.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
