'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getAccounts, createAccount, updateAccount, deleteAccount, Account } from '@/app/actions/finance';
import type { AccountCategory, AccountNormalBalance } from '@/lib/definitions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const accountSchema = z.object({
  code: z.string().min(3, 'Kode harus memiliki setidaknya 3 karakter'),
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  category: z.enum(['Aset', 'Liabilitas', 'Ekuitas', 'Pendapatan', 'Beban']),
  normalBalance: z.enum(['Debit', 'Kredit']),
});

type AccountFormData = z.infer<typeof accountSchema>;

const AccountFormDialog = ({ account, onSave, isSaving, onClose }: { account?: Account | null; onSave: (data: AccountFormData) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: account || { code: '', name: '', category: 'Aset', normalBalance: 'Debit' },
  });

  useEffect(() => {
    reset(account || { code: '', name: '', category: 'Aset', normalBalance: 'Debit' });
  }, [account, reset]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Akun' : 'Tambah Akun Baru'}</DialogTitle>
          <DialogDescription>
            Isi detail untuk akun dalam Daftar Akun Anda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Akun</Label>
              <Input id="code" {...register('code')} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Akun</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aset">Aset</SelectItem>
                    <SelectItem value="Liabilitas">Liabilitas</SelectItem>
                    <SelectItem value="Ekuitas">Ekuitas</SelectItem>
                    <SelectItem value="Pendapatan">Pendapatan</SelectItem>
                    <SelectItem value="Beban">Beban</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Saldo Normal</Label>
              <Controller name="normalBalance" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              )} />
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

export default function ChartOfAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getAccounts();
      setAccounts(fetchedData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat Daftar Akun' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSave = async (data: AccountFormData) => {
    setIsSaving(true);
    try {
      if (selectedAccount?.id) {
        await updateAccount(selectedAccount.id, data);
        toast({ title: 'Akun berhasil diperbarui!' });
      } else {
        await createAccount(data);
        toast({ title: 'Akun baru berhasil ditambahkan!' });
      }
      fetchAccounts();
      setIsDialogOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (itemToDelete?.id) {
      try {
        await deleteAccount(itemToDelete.id);
        toast({ title: 'Akun dihapus!' });
        fetchAccounts();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus akun', description: (error as Error).message });
      } finally {
        setItemToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Daftar Akun</h1>
          <p className="text-muted-foreground">Kelola semua akun keuangan yang digunakan dalam organisasi.</p>
        </div>
        <Button onClick={() => { setSelectedAccount(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Akun Baru
        </Button>
      </div>

      {isDialogOpen && <AccountFormDialog account={selectedAccount} onSave={handleSave} isSaving={isSaving} onClose={() => setIsDialogOpen(false)} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
          <CardDescription>Total {accounts.length} akun ditemukan. Klik nama akun untuk melihat buku besar.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Saldo Normal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map(acc => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-mono">{acc.code}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/panel/finance/ledger/${acc.id}`} className="hover:underline text-primary">
                            {acc.name}
                        </Link>
                    </TableCell>
                    <TableCell>{acc.category}</TableCell>
                    <TableCell>{acc.normalBalance}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedAccount(acc); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete(acc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {accounts.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">Belum ada akun yang dibuat.</TableCell>
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
            <AlertDialogTitle>Anda yakin ingin menghapus akun ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <span className="font-semibold">"{itemToDelete?.name}"</span> akan dihapus. Ini tidak dapat dibatalkan. Pastikan akun tidak memiliki saldo atau transaksi terkait.
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
