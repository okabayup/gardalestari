
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MessageSquareWarning, Users, History, UserSearch } from 'lucide-react';
import { sendTestMessage, sendBulkTestMessage, sendVerificationReminders, getUnverifiedUserCount, sendGroupJoinReminders, getVerifiedMemberCount } from '@/app/actions/whatsapp';
import { useRouter } from 'next/navigation';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { getMembers, MemberWithStatus } from '@/app/actions/members';
import { DataTable } from '@/components/panel/DataTable';
import { columns as memberColumns } from '@/app/panel/members/columns';
import type { ColumnDef } from '@tanstack/react-table';

const singleMessageSchema = z.object({
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});
type SingleMessageFormData = z.infer<typeof singleMessageSchema>;

const bulkMessageSchema = z.object({
  phoneNumbers: z.string().min(10, 'Setidaknya satu nomor telepon dibutuhkan'),
  bulkMessage: z.string().min(1, 'Pesan tidak boleh kosong'),
});
type BulkMessageFormData = z.infer<typeof bulkMessageSchema>;


export default function WhatsappTestPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingBulk, setLoadingBulk] = useState(false);
  
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);

  const [loadingReminder, setLoadingReminder] = useState(false);
  const [loadingGroupReminder, setLoadingGroupReminder] = useState(false);

  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const [showGroupReminderConfirm, setShowGroupReminderConfirm] = useState(false);

  const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
  const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getUnverifiedUserCount().then(setUnverifiedCount);
    getVerifiedMemberCount().then(setVerifiedCount);
    getMembers(false).then(setAllMembers);
  }, []);

  const singleForm = useForm<SingleMessageFormData>({ resolver: zodResolver(singleMessageSchema) });
  const bulkForm = useForm<BulkMessageFormData>({ resolver: zodResolver(bulkMessageSchema) });

  const onTestSubmit = async (data: SingleMessageFormData) => {
    setLoadingSingle(true);
    try {
      const formattedNumber = data.phoneNumber.startsWith('0') ? `62${data.phoneNumber.substring(1)}` : data.phoneNumber;
      await sendTestMessage(formattedNumber, data.message);
      toast({ title: 'Pesan Terkirim!', description: `Pesan tes berhasil dikirim ke ${formattedNumber}` });
      singleForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim', description: (error as Error).message });
    } finally {
      setLoadingSingle(false);
    }
  };
  
  const onBulkTestSubmit = async (data: BulkMessageFormData) => {
    setLoadingBulk(true);
     try {
      const result = await sendBulkTestMessage(data.phoneNumbers, data.bulkMessage);
      toast({ title: 'Pesan Massal Terkirim!', description: `Pesan tes berhasil dikirim ke ${result.count} nomor.` });
      bulkForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim Pesan Massal', description: (error as Error).message });
    } finally {
      setLoadingBulk(false);
    }
  };

  const handleSendReminders = async () => {
    setShowReminderConfirm(false);
    setLoadingReminder(true);
    try {
      const result = await sendVerificationReminders();
      toast({ title: 'Pengingat Terkirim!', description: `Pesan pengingat berhasil dikirim ke ${result.count} anggota.` });
      getUnverifiedUserCount().then(setUnverifiedCount);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim Pengingat', description: (error as Error).message });
    } finally {
      setLoadingReminder(false);
    }
  };

  const handleSendGroupReminders = async () => {
    setShowGroupReminderConfirm(false);
    setLoadingGroupReminder(true);
    try {
      const result = await sendGroupJoinReminders();
      toast({ title: 'Pengingat Grup Terkirim!', description: `Pesan pengingat berhasil dikirim ke ${result.count} anggota.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim Pengingat Grup', description: (error as Error).message });
    } finally {
      setLoadingGroupReminder(false);
    }
  }

  const handleApplySelectedMembers = () => {
    const selectedPhoneNumbers = Object.keys(selectedMembers).map(memberId => {
      const member = allMembers.find(m => m.id === memberId);
      return member?.waNumber;
    }).filter(Boolean);

    if (selectedPhoneNumbers.length > 100) {
      toast({
        variant: 'destructive',
        title: 'Batas Maksimal Terlampaui',
        description: `Anda hanya dapat memilih maksimal 100 anggota. Anda memilih ${selectedPhoneNumbers.length}.`,
      });
      return;
    }

    bulkForm.setValue('phoneNumbers', selectedPhoneNumbers.join(', '));
    setIsMemberSelectorOpen(false);
  };
  
  const bulkMessageColumns: ColumnDef<MemberWithStatus>[] = useMemo(() => [
      {
          id: 'select',
          header: ({ table }) => (
              <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                  aria-label="Pilih semua"
              />
          ),
          cell: ({ row }) => (
              <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Pilih baris"
              />
          ),
          enableSorting: false,
          enableHiding: false,
      },
      ...memberColumns.filter(c => c.id !== 'actions')
  ], []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="font-headline text-2xl font-bold">Manajemen WhatsApp</h1>
                <p className="text-muted-foreground">Kelola notifikasi otomatis, blast, dan uji coba pengiriman pesan.</p>
            </div>
            <div className='flex gap-2'>
              <Button variant="outline" onClick={() => router.push('/panel/whatsapp/templates')}>
                  Kelola Template
              </Button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle>Pengingat Verifikasi Anggota</CardTitle>
                  <CardDescription>
                      Kirim pengingat massal kepada {unverifiedCount > 0 ? `${unverifiedCount} anggota` : 'anggota'} yang belum menyelesaikan proses verifikasi.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={() => setShowReminderConfirm(true)} disabled={loadingReminder || unverifiedCount === 0}>
                      {loadingReminder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <MessageSquareWarning className="mr-2 h-4 w-4" />
                      Kirim Pengingat Verifikasi
                  </Button>
              </CardContent>
          </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Pengingat Gabung Grup</CardTitle>
                  <CardDescription>
                      Kirim undangan ke grup WhatsApp kepada {verifiedCount > 0 ? `${verifiedCount} anggota` : 'anggota'} terverifikasi.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={() => setShowGroupReminderConfirm(true)} disabled={loadingGroupReminder || verifiedCount === 0}>
                      {loadingGroupReminder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Users className="mr-2 h-4 w-4" />
                      Kirim Undangan Grup
                  </Button>
              </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
              <CardTitle>Uji Kirim Pesan Tunggal</CardTitle>
              <CardDescription>Verifikasi koneksi dengan API SatuConnect dengan mengirim pesan tes ke satu nomor.</CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={singleForm.handleSubmit(onTestSubmit)} className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Nomor Telepon Tujuan</Label>
                  <Input id="phoneNumber" type="tel" {...singleForm.register('phoneNumber')} placeholder="Contoh: 081234567890" />
                  {singleForm.formState.errors.phoneNumber && <p className="text-sm text-destructive">{singleForm.formState.errors.phoneNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="message">Isi Pesan</Label>
                  <Textarea id="message" {...singleForm.register('message')} placeholder="Ini adalah pesan tes dari Garda Lestari."/>
                  {singleForm.formState.errors.message && <p className="text-sm text-destructive">{singleForm.formState.errors.message.message}</p>}
                  </div>
                  <Button type="submit" disabled={loadingSingle} className="w-full">
                  {loadingSingle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Pesan Tes
                  </Button>
              </form>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Uji Kirim Pesan Massal</CardTitle>
                        <CardDescription>Kirim pesan ke beberapa nomor sekaligus.</CardDescription>
                    </div>
                    <Dialog open={isMemberSelectorOpen} onOpenChange={setIsMemberSelectorOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><UserSearch className="mr-2 h-4 w-4"/> Pilih Penerima</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Pilih Anggota</DialogTitle>
                                <DialogDescription>Pilih anggota untuk dikirimi pesan. Maksimal 100 anggota.</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-auto">
                                <DataTable 
                                    columns={bulkMessageColumns} 
                                    data={allMembers.filter(m => m.waNumber)}
                                    rowSelection={selectedMembers}
                                    setRowSelection={setSelectedMembers}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsMemberSelectorOpen(false)}>Batal</Button>
                                <Button onClick={handleApplySelectedMembers}>Terapkan</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </CardHeader>
              <CardContent>
              <form onSubmit={bulkForm.handleSubmit(onBulkTestSubmit)} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="phoneNumbers">Nomor Telepon Tujuan (pisahkan dengan koma)</Label>
                      <Textarea id="phoneNumbers" {...bulkForm.register('phoneNumbers')} placeholder="6281..., 6285..., 0812..." />
                      {bulkForm.formState.errors.phoneNumbers && <p className="text-sm text-destructive">{bulkForm.formState.errors.phoneNumbers.message}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="bulkMessage">Isi Pesan</Label>
                      <Textarea id="bulkMessage" {...bulkForm.register('bulkMessage')} placeholder="Ini adalah pengumuman untuk semua anggota."/>
                      {bulkForm.formState.errors.bulkMessage && <p className="text-sm text-destructive">{bulkForm.formState.errors.bulkMessage.message}</p>}
                  </div>
                  <Button type="submit" disabled={loadingBulk} className="w-full">
                      {loadingBulk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Pesan Massal
                  </Button>
              </form>
              </CardContent>
          </Card>
        </div>
      </div>

       <AlertDialog open={showReminderConfirm} onOpenChange={setShowReminderConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengiriman Pengingat</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengirimkan pesan pengingat verifikasi ke <span className="font-bold">{unverifiedCount}</span> anggota.
              Tindakan ini mungkin memakan waktu dan biaya pulsa. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendReminders}>
              Ya, Kirim Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={showGroupReminderConfirm} onOpenChange={setShowGroupReminderConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Undangan Grup</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengirimkan undangan grup WhatsApp ke <span className="font-bold">{verifiedCount}</span> anggota terverifikasi.
              Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendGroupReminders}>
              Ya, Kirim Undangan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
