'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { createJournalEntry, getAccounts, Account } from '@/app/actions/finance';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  accountId: z.string().min(1, 'Akun harus dipilih'),
  debit: z.coerce.number().min(0),
  credit: z.coerce.number().min(0),
});

const formSchema = z.object({
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  transactions: z.array(transactionSchema).min(2, 'Minimal harus ada dua transaksi'),
}).refine(data => {
    const totalDebit = data.transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = data.transactions.reduce((sum, t) => sum + t.credit, 0);
    return totalDebit === totalCredit;
}, {
    message: 'Total debit dan kredit harus seimbang (balance).',
    path: ['transactions'],
});

type FormData = z.infer<typeof formSchema>;

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      transactions: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "transactions"
  });

  const watchTransactions = watch('transactions');
  const totalDebit = watchTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = watchTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);

  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Anda harus login' });
        return;
    }
    setLoading(true);
    try {
      const payload = {
        ...data,
        date: data.date.toISOString(),
        createdBy: user.uid,
      };
      await createJournalEntry(payload);
      toast({ title: 'Entri jurnal berhasil dibuat!' });
      router.push('/panel/finance/journal');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat entri', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Buat Entri Jurnal Baru</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/finance/journal')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Entri
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Detail Transaksi</CardTitle>
            <CardDescription>Catat transaksi keuangan baru ke dalam Jurnal Umum.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Tanggal Transaksi</Label>
                <Controller name="date" control={control} render={({ field }) => (
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                )} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" {...register('description')} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </div>
          
          <div className="pt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Akun</TableHead>
                        <TableHead className="text-right">Debit (Rp)</TableHead>
                        <TableHead className="text-right">Kredit (Rp)</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((field, index) => (
                        <TableRow key={field.id}>
                            <TableCell>
                                <Controller
                                    name={`transactions.${index}.accountId`}
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Pilih akun..." /></SelectTrigger>
                                            <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id!}>{acc.code} - {acc.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    )}
                                />
                            </TableCell>
                            <TableCell><Input type="number" {...register(`transactions.${index}.debit`)} className="text-right font-mono" /></TableCell>
                            <TableCell><Input type="number" {...register(`transactions.${index}.credit`)} className="text-right font-mono" /></TableCell>
                            <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {errors.transactions && <p className="text-sm text-destructive pt-2">{errors.transactions.message || errors.transactions.root?.message}</p>}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ accountId: '', debit: 0, credit: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4"/>Tambah Baris
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Debit</span><span className="font-mono">{totalDebit.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Kredit</span><span className="font-mono">{totalCredit.toLocaleString('id-ID')}</span></div>
              <div className={cn("flex justify-between font-bold", totalDebit !== totalCredit ? 'text-destructive' : 'text-green-600')}>
                  <span>Selisih</span>
                  <span className="font-mono">{(totalDebit - totalCredit).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
