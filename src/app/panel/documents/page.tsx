'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Tags, QrCode, Send, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getDocuments, deleteDocument, ImportantDocument, submitForApproval, approveDocument } from '@/app/actions/documents';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { toPng } from 'html-to-image';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getMembers, MemberWithStatus } from '@/app/actions/members';

const QRDialog = ({ document, isOpen, onClose }: { document: ImportantDocument | null, isOpen: boolean, onClose: () => void }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    if (!document) return null;

    const verificationUrl = `${window.location.origin}/dokumen/verifikasi/${document.id}`;

    const handleDownloadQR = async () => {
        if (!qrRef.current) return;
        const dataUrl = await toPng(qrRef.current);
        const link = document.createElement('a');
        link.download = `QR-Verifikasi-${document.title.replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>QR Code Verifikasi Dokumen</DialogTitle>
                    <DialogDescription>Pindai QR code ini untuk melihat halaman verifikasi keaslian dokumen.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-4" ref={qrRef}>
                    <QRCode
                        value={verificationUrl}
                        size={256}
                        imageSettings={{
                            src: '/logo.png',
                            height: 40,
                            width: 40,
                            excavate: true,
                        }}
                        level="H"
                    />
                     <p className="mt-4 text-sm font-mono break-all text-muted-foreground">{verificationUrl}</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                    <Button onClick={handleDownloadQR}>Unduh QR Code</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ApprovalDialog = ({ document, members, isOpen, onClose, onConfirm }: { document: ImportantDocument | null, members: MemberWithStatus[], isOpen: boolean, onClose: () => void, onConfirm: (approverId: string) => void }) => {
    const [approverId, setApproverId] = useState('');
    const [loading, setLoading] = useState(false);
    
    if (!document) return null;

    const handleConfirm = async () => {
        if (!approverId) return;
        setLoading(true);
        await onConfirm(approverId);
        setLoading(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajukan Persetujuan Surat</DialogTitle>
                    <DialogDescription>Pilih siapa yang harus meninjau dan menyetujui surat "{document.title}". Pengguna yang dipilih akan menerima notifikasi.</DialogDescription>
                </DialogHeader>
                 <div className="py-4">
                     <Select onValueChange={setApproverId} value={approverId}>
                        <SelectTrigger><SelectValue placeholder="Pilih pejabat berwenang..." /></SelectTrigger>
                        <SelectContent>
                            {members.filter(m => m.id !== document.authorId).map(member => (
                                <SelectItem key={member.id} value={member.id}>{member.name} ({member.position})</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
                    <Button onClick={handleConfirm} disabled={!approverId || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Kirim Permintaan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function EOfficePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ImportantDocument[]>([]);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ImportantDocument | null>(null);
  const [qrDialogItem, setQrDialogItem] = useState<ImportantDocument | null>(null);
  const [approvalDialogItem, setApprovalDialogItem] = useState<ImportantDocument | null>(null);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [docs, mems] = await Promise.all([getDocuments(), getMembers()]);
            setDocuments(docs);
            setMembers(mems.filter(m => m.position && m.position !== 'Anggota')); // Filter for approvers
        } catch (error) {
            toast({ variant: "destructive", title: "Gagal memuat data" });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  const fetchDocuments = async () => {
    try {
        const data = await getDocuments();
        setDocuments(data);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Gagal memperbarui daftar surat.'});
    }
  }

  const handleDeleteClick = (doc: ImportantDocument) => {
    setItemToDelete(doc);
    setShowDeleteAlert(true);
  };

  const handleApproveClick = async (doc: ImportantDocument) => {
    if (!doc.id || !user?.uid) return;
    try {
      await approveDocument(doc.id, user.uid);
      toast({ title: 'Dokumen disetujui dan disahkan!' });
      fetchDocuments();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyetujui', description: (error as Error).message });
    }
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(itemToDelete.id);
    try {
      await deleteDocument(itemToDelete.id);
      toast({ title: "Surat berhasil dihapus." });
      fetchDocuments();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: (error as Error).message });
    } finally {
      setIsDeleting(null);
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };
  
  const handleApprovalSubmit = async (approverId: string) => {
    if (!approvalDialogItem?.id || !user?.uid) return;
    try {
        await submitForApproval(approvalDialogItem.id, user.uid, approverId);
        toast({ title: 'Permintaan persetujuan terkirim!'});
        setApprovalDialogItem(null);
        fetchDocuments();
    } catch (error) {
         toast({ variant: 'destructive', title: 'Gagal mengirim', description: (error as Error).message });
    }
  }
  
  const getStatusBadge = (status: ImportantDocument['status']) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="outline">Draf</Badge>;
      case 'Menunggu Persetujuan':
        return <Badge className="bg-yellow-500 hover:bg-yellow-500/80">Menunggu Persetujuan</Badge>;
      case 'Disetujui':
        return <Badge className="bg-green-500 hover:bg-green-500/80">Disetujui & Disahkan</Badge>;
      case 'Ditolak':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">Tidak Diketahui</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">E-Office: Manajemen Surat</h1>
            <p className="text-muted-foreground">Buat, sahkan, dan arsipkan surat resmi organisasi secara digital.</p>
          </div>
          <Button onClick={() => router.push('/panel/e-office/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Surat Baru
          </Button>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Arsip Surat</CardTitle>
              <CardDescription>Total {documents.length} surat ditemukan.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/panel/e-office/categories')}>
                <Tags className="mr-2 h-4 w-4" />
                Kelola Kategori
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detail Surat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : documents.length > 0 ? (
                  documents.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link href={item.fileUrl} target="_blank" className="hover:underline text-primary">
                          {item.title}
                        </Link>
                         <p className="text-xs text-muted-foreground font-mono">{item.documentNumber}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.authorName}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.status === 'Draft' && item.authorId === user?.uid && (
                                <DropdownMenuItem onClick={() => setApprovalDialogItem(item)}>
                                    <Send className="mr-2 h-4 w-4" /> Ajukan Persetujuan
                                </DropdownMenuItem>
                            )}
                            {item.status === 'Menunggu Persetujuan' && item.approverId === user?.uid && (
                                <DropdownMenuItem onClick={() => handleApproveClick(item)}>
                                    <Check className="mr-2 h-4 w-4" /> Setujui Surat
                                </DropdownMenuItem>
                            )}
                            {item.status === 'Disetujui' && (
                               <DropdownMenuItem onClick={() => setQrDialogItem(item)}>
                                    <QrCode className="mr-2 h-4 w-4" /> Lihat QR Pengesahan
                                </DropdownMenuItem>
                            )}
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => router.push(`/panel/e-office/edit/${item.id}`)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(item)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Belum ada surat yang dibuat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus surat <span className="font-semibold">"{itemToDelete?.title}"</span> secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <QRDialog document={qrDialogItem} isOpen={!!qrDialogItem} onClose={() => setQrDialogItem(null)} />
       <ApprovalDialog 
          document={approvalDialogItem} 
          members={members}
          isOpen={!!approvalDialogItem} 
          onClose={() => setApprovalDialogItem(null)}
          onConfirm={handleApprovalSubmit}
      />
    </>
  );
}
