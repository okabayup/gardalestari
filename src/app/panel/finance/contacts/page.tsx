
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getContacts, createContact, Contact } from '@/app/actions/finance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle, Building, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const contactSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  type: z.enum(['customer', 'vendor', 'other']),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactFormDialog = ({ onSave, isSaving, onClose }: { onSave: (data: ContactFormData) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'customer' },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Kontak Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kontak</Label>
            <Input id="name" {...register('name')} placeholder="Nama pelanggan atau vendor" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Controller name="type" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Pelanggan</SelectItem>
                  <SelectItem value="vendor">Pemasok/Vendor</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">No. Telepon</Label>
              <Input id="phoneNumber" {...register('phoneNumber')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" {...register('address')} />
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


export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getContacts();
      setContacts(fetchedData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat kontak' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSave = async (data: ContactFormData) => {
    setIsSaving(true);
    try {
      await createContact(data);
      toast({ title: 'Kontak berhasil ditambahkan!' });
      fetchContacts();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Buku Bantu Kontak</h1>
          <p className="text-muted-foreground">Kelola daftar pelanggan, vendor, dan kontak lainnya.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Kontak
        </Button>
      </div>

      {isDialogOpen && <ContactFormDialog onSave={handleSave} isSaving={isSaving} onClose={() => setIsDialogOpen(false)} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kontak</CardTitle>
          <CardDescription>Total {contacts.length} kontak ditemukan.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map(contact => (
                <Card key={contact.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            {contact.type === 'customer' ? <User className="h-5 w-5 text-primary"/> : <Building className="h-5 w-5 text-primary"/>}
                            {contact.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                        <p>{contact.email}</p>
                        <p>{contact.phoneNumber}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Belum ada kontak yang ditambahkan.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

