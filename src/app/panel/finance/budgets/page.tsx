

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { getAccounts, Account, saveBudgets, getBudgetsForPeriod } from '@/app/actions/finance';
import type { Budget } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function BudgetsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [currentPeriod, setCurrentPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const { control, handleSubmit, setValue, getValues } = useForm();

  const fetchBudgetData = useCallback(async (period: string) => {
    setLoading(true);
    try {
      const [accountsData, budgetsData] = await Promise.all([
        getAccounts(),
        getBudgetsForPeriod(period),
      ]);
      
      const expenseAccounts = accountsData.filter(acc => acc.category === 'Beban');
      setAccounts(expenseAccounts);
      
      const initialBudgets: Record<string, number> = {};
      expenseAccounts.forEach(acc => {
        const budget = budgetsData.find(b => b.accountId === acc.id);
        initialBudgets[acc.id!] = budget?.amount || 0;
      });
      setBudgets(initialBudgets);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat data', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchBudgetData(currentPeriod);
  }, [currentPeriod, fetchBudgetData]);

  const handleBudgetChange = (accountId: string, amount: string) => {
    setBudgets(prev => ({
        ...prev,
        [accountId]: Number(amount) || 0,
    }));
  };

  const onSubmit = async () => {
    setIsSaving(true);
    try {
      const budgetsToSave = Object.entries(budgets)
        .filter(([, amount]) => amount > 0)
        .map(([accountId, amount]) => {
            const account = accounts.find(a => a.id === accountId);
            return {
                accountId,
                accountName: account?.name || 'Unknown',
                amount
            };
        });

      await saveBudgets(currentPeriod, budgetsToSave);
      toast({ title: 'Anggaran berhasil disimpan!' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Gagal menyimpan anggaran', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  };
  
  const totalBudget = useMemo(() => {
      return Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
  }, [budgets]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString().padStart(2, '0'), label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Anggaran</h1>
          <p className="text-muted-foreground">Atur alokasi dana untuk setiap pos pengeluaran per periode.</p>
        </div>
        <Button onClick={onSubmit} disabled={isSaving || loading}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Simpan Anggaran
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Periode Anggaran</CardTitle>
           <div className="flex gap-2">
                <Select value={currentPeriod.split('-')[0]} onValueChange={(year) => setCurrentPeriod(`${year}-${currentPeriod.split('-')[1]}`)}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={currentPeriod.split('-')[1]} onValueChange={(month) => setCurrentPeriod(`${currentPeriod.split('-')[0]}-${month}`)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <form>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Akun Beban</TableHead>
                        <TableHead className="text-right w-48">Jumlah Anggaran (Rp)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={2} className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                    ) : accounts.length > 0 ? (
                        accounts.map(account => (
                            <TableRow key={account.id}>
                                <TableCell className="font-medium">{account.name}</TableCell>
                                <TableCell className="text-right">
                                    <Input 
                                        type="number" 
                                        className="text-right font-mono"
                                        value={budgets[account.id!] || ''}
                                        onChange={(e) => handleBudgetChange(account.id!, e.target.value)}
                                        placeholder="0"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow><TableCell colSpan={2} className="text-center p-8 text-muted-foreground">Tidak ada akun beban.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </form>
        </CardContent>
         <CardHeader>
            <CardTitle className="text-lg">Total Anggaran: {totalBudget.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
