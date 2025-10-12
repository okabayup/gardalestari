
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Tags, QrCode, Send, Check, X, Eye } from 'lucide-react';
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
import { getDocuments, deleteDocument, ImportantDocument, submitForApproval, approveDocument, rejectDocument } from '@/app/actions/documents';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { toPng } from 'html-to-image';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import DocumentPreviewDialog from '@/components/panel/documents/DocumentPreviewDialog';


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

const RejectDialog = ({ document, isOpen, onClose, onConfirm }: { document: ImportantDocument | null, isOpen: boolean, onClose: () => void, onConfirm: (reason: string) => void }) => {
    const [reason, setReason] = useState('');
    if (!document) return null;

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tolak Dokumen</DialogTitle>
                    <DialogDescription>Berikan alasan penolakan untuk dokumen "{document.title}".</DialogDescription>
                </DialogHeader>
                 <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan..." />
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Batal</Button>
                    <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>Tolak Dokumen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function DocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ImportantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ImportantDocument | null>(null);

  const [qrDialogItem, setQrDialogItem] = useState<ImportantDocument | null>(null);
  const [rejectDialogItem, setRejectDialogItem] = useState<ImportantDocument | null>(null);
  const [previewDialogItem, setPreviewDialogItem] = useState<ImportantDocument | null>(null);


  useEffect(() => {
    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
        const data = await getDocuments();
        setDocuments(data);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Gagal memuat dokumen.'});
    } finally {
        setLoading(false);
    }
  }

  const handleDeleteClick = (doc: ImportantDocument) => {
    setItemToDelete(doc);
    setShowDeleteAlert(true);
  };
  
  const handleAction = async (action: () => Promise<any>, docId: string, successMessage: string, errorMessage: string) => {
    setActionLoading(docId);
    try {
      await action();
      toast({ title: successMessage });
      fetchDocuments();
    } catch (error) {
      toast({ variant: 'destructive', title: errorMessage, description: (error as Error).message });
    } finally {
      setActionLoading(null);
    }
  }

  const handleApproveClick = (doc: ImportantDocument) => {
    if (!doc.id || !user?.uid) return;
    handleAction(() => approveDocument(doc.id!, user.uid), doc.id, 'Dokumen disetujui!', 'Gagal Menyetujui');
  }

  const handleRejectConfirm = (reason: string) => {
    if (!rejectDialogItem?.id || !user?.uid) return;
    handleAction(() => rejectDocument(rejectDialogItem.id!, user.uid, reason), rejectDialogItem.id, 'Dokumen ditolak.', 'Gagal Menolak');
    setRejectDialogItem(null);
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    handleAction(() => deleteDocument(itemToDelete!.id!), itemToDelete.id, "Dokumen berhasil dihapus.", "Gagal menghapus");
    setShowDeleteAlert(false);
    setItemToDelete(null);
  };
  
  const handleApprovalSubmit = async (doc: ImportantDocument) => {
    if (!doc.id || !user?.uid) return;
    handleAction(() => submitForApproval(doc.id!, user.uid), doc.id, 'Permintaan terkirim!', 'Gagal Mengirim');
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
            <h1 className="font-headline text-2xl font-bold">Dokumen Penting (E-Office)</h1>
            <p className="text-muted-foreground">Buat, sahkan, dan arsipkan dokumen resmi organisasi secara digital.</p>
          </div>
          <Button onClick={() => router.push('/panel/documents/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Dokumen Baru
          </Button>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Arsip Dokumen</CardTitle>
              <CardDescription>Total {documents.length} dokumen ditemukan.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/panel/documents/categories')}>
                <Tags className="mr-2 h-4 w-4" />
                Kelola Atribut
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detail Dokumen</TableHead>
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
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!actionLoading}>
                              {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(item.status === 'Draft' || item.status === 'Ditolak') && item.authorId === user?.uid && (
                                <DropdownMenuItem onClick={() => handleApprovalSubmit(item)}>
                                    <Send className="mr-2 h-4 w-4" /> Ajukan Persetujuan
                                </DropdownMenuItem>
                            )}
                            {item.status === 'Menunggu Persetujuan' && item.approverId === user?.uid && (
                                <>
                                <DropdownMenuItem onClick={() => setPreviewDialogItem(item)}>
                                    <Eye className="mr-2 h-4 w-4" /> Tinjau & Setujui
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRejectDialogItem(item)} className="text-destructive">
                                    <X className="mr-2 h-4 w-4" /> Tolak Dokumen
                                </DropdownMenuItem>
                                </>
                            )}
                            {item.status === 'Disetujui' && (
                               <DropdownMenuItem onClick={() => setQrDialogItem(item)}>
                                    <QrCode className="mr-2 h-4 w-4" /> Lihat QR Pengesahan
                                </DropdownMenuItem>
                            )}
                            {(item.authorId === user?.uid || user?.uid === process.env.KETUA_UMUM_UID) && <DropdownMenuSeparator />}
                            <DropdownMenuItem onClick={() => router.push(`/panel/documents/edit/${item.id}`)} disabled={item.status !== 'Draft' && item.authorId !== user?.uid}>Edit</DropdownMenuItem>
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
                      Belum ada dokumen yang dibuat.
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
              Tindakan ini akan menghapus dokumen <span className="font-semibold">"{itemToDelete?.title}"</span> secara permanen.
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
      <RejectDialog document={rejectDialogItem} isOpen={!!rejectDialogItem} onClose={() => setRejectDialogItem(null)} onConfirm={handleRejectConfirm} />
      <DocumentPreviewDialog 
        document={previewDialogItem}
        isOpen={!!previewDialogItem}
        onClose={() => setPreviewDialogItem(null)}
        onApprove={() => {
            if (previewDialogItem) handleApproveClick(previewDialogItem);
            setPreviewDialogItem(null);
        }}
        onReject={() => {
            setRejectDialogItem(previewDialogItem);
            setPreviewDialogItem(null);
        }}
      />
    </>
  );
}
