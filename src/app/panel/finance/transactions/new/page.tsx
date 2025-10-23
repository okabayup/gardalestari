
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar as CalendarIcon, Minus, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createSimpleTransaction, getAccounts, Account } from '@/app/actions/finance';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  amount: z.coerce.number().min(0.01, 'Jumlah harus lebih dari 0'),
  cashBankAccountId: z.string().min(1, 'Akun kas/bank harus dipilih'),
  categoryAccountId: z.string().min(1, 'Akun kategori harus dipilih'),
});

type FormData = z.infer<typeof formSchema>;
type TransactionType = 'expense' | 'income';

export default function NewTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ 
    resolver: zodResolver(formSchema),
    defaultValues: { date: new Date(), amount: 0 }
  });

  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  const cashAndBankAccounts = accounts.filter(acc => acc.category === 'Aset');
  const categoryAccounts = accounts.filter(acc => 
    transactionType === 'expense' ? acc.category === 'Beban' : acc.category === 'Pendapatan'
  );

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      await createSimpleTransaction(
        transactionType,
        Timestamp.fromDate(data.date),
        data.amount,
        data.description,
        data.cashBankAccountId,
        data.categoryAccountId,
        user.uid
      );
      toast({ title: 'Transaksi berhasil dicatat!' });
      reset();
      router.push('/panel/finance/journal');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mencatat transaksi', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Catat Transaksi</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/finance/dashboard')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Transaksi
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <ToggleGroup
              type="single"
              defaultValue="expense"
              value={transactionType}
              onValueChange={(value: TransactionType) => value && setTransactionType(value)}
              className="w-full grid grid-cols-2"
            >
              <ToggleGroupItem value="expense" aria-label="Pengeluaran" className="h-12 flex-col gap-1">
                <Minus/> Pengeluaran
              </ToggleGroupItem>
              <ToggleGroupItem value="income" aria-label="Penerimaan" className="h-12 flex-col gap-1">
                <Plus/> Penerimaan
              </ToggleGroupItem>
            </ToggleGroup>
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
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input id="amount" type="number" {...register('amount')} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input id="description" {...register('description')} placeholder={transactionType === 'expense' ? 'Contoh: Pembelian bensin untuk operasional' : 'Contoh: Donasi dari Hamba Allah'}/>
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>{transactionType === 'expense' ? 'Dari Akun (Kas/Bank)' : 'Ke Akun (Kas/Bank)'}</Label>
                <Controller name="cashBankAccountId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih akun kas/bank..." /></SelectTrigger>
                        <SelectContent>{cashAndBankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id!}>{acc.name}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                 {errors.cashBankAccountId && <p className="text-sm text-destructive">{errors.cashBankAccountId.message}</p>}
            </div>
            <div className="space-y-2">
                 <Label>{transactionType === 'expense' ? 'Untuk Keperluan (Kategori Beban)' : 'Dari Sumber (Kategori Pendapatan)'}</Label>
                 <Controller name="categoryAccountId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                        <SelectContent>{categoryAccounts.map(acc => <SelectItem key={acc.id} value={acc.id!}>{acc.name}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                 {errors.categoryAccountId && <p className="text-sm text-destructive">{errors.categoryAccountId.message}</p>}
            </div>
           </div>
        </CardContent>
      </Card>
    </form>
  );
}
