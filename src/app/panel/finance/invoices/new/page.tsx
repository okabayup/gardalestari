
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
import { Loader2, Calendar as CalendarIcon, PlusCircle, Trash2, UserSearch } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createInvoice } from '@/app/actions/finance';
import { getContacts, Contact } from '@/app/actions/finance';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceItem } from '@/lib/definitions';

const formSchema = z.object({
  contactId: z.string().min(1, 'Pelanggan harus dipilih'),
  date: z.date({ required_error: 'Tanggal faktur wajib diisi' }),
  dueDate: z.date({ required_error: 'Tanggal jatuh tempo wajib diisi' }),
  items: z.array(z.object({
    description: z.string().min(1, 'Deskripsi tidak boleh kosong'),
    quantity: z.coerce.number().min(0.1, 'Kuantitas minimal 0.1'),
    unitPrice: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  })).min(1, 'Minimal harus ada satu item'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch('items');
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.11; // Example 11% tax
  const total = subtotal + tax;

  useEffect(() => {
    getContacts().then(data => {
        setContacts(data.filter(c => c.type === 'customer'));
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    const selectedContact = contacts.find(c => c.id === data.contactId);
    if (!selectedContact) {
        toast({ variant: 'destructive', title: 'Pelanggan tidak valid' });
        setLoading(false);
        return;
    }

    const payload: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'> = {
      contactId: data.contactId,
      contactName: selectedContact.name,
      date: Timestamp.fromDate(data.date),
      dueDate: Timestamp.fromDate(data.dueDate),
      items: data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
      subtotal,
      tax,
      total,
      status: 'draft',
      createdBy: user.uid,
    };

    try {
      await createInvoice(payload, user.uid);
      toast({ title: 'Faktur berhasil dibuat sebagai draf!' });
      router.push('/panel/finance/invoices');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal membuat faktur', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Buat Faktur Baru</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/finance/invoices')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Draf Faktur
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Faktur</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih pelanggan..." /></SelectTrigger>
                    <SelectContent>
                      {contacts.map(c => <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.contactId && <p className="text-sm text-destructive">{errors.contactId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tanggal Faktur</Label>
              <Controller name="date" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "d MMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
              )} />
            </div>
             <div className="space-y-2">
              <Label>Tanggal Jatuh Tempo</Label>
              <Controller name="dueDate" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "d MMM yyyy") : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
              )} />
            </div>
          </div>
          
          <div className="pt-4">
            <Label>Item Tagihan</Label>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">Deskripsi</TableHead>
                        <TableHead>Kuantitas</TableHead>
                        <TableHead>Harga Satuan</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((field, index) => (
                        <TableRow key={field.id}>
                            <TableCell><Input {...register(`items.${index}.description`)} /></TableCell>
                            <TableCell><Input type="number" {...register(`items.${index}.quantity`)} /></TableCell>
                            <TableCell><Input type="number" {...register(`items.${index}.unitPrice`)} /></TableCell>
                            <TableCell className="text-right font-mono">{(watchItems[index]?.quantity * watchItems[index]?.unitPrice || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {errors.items && <p className="text-sm text-destructive pt-2">{errors.items.message || errors.items.root?.message}</p>}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4"/>Tambah Baris
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{subtotal.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pajak (11%)</span><span className="font-mono">{tax.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span >Total</span><span className="font-mono">{total.toLocaleString('id-ID')}</span></div>
            </div>
          </div>

        </CardContent>
      </Card>
    </form>
  );
}
