
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Tags, QrCode } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { getDocuments, deleteDocument, ImportantDocument } from '@/app/actions/documents';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { toPng } from 'html-to-image';

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


export default function AdminDocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ImportantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ImportantDocument | null>(null);
  const [qrDialogItem, setQrDialogItem] = useState<ImportantDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memuat dokumen" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (doc: ImportantDocument) => {
    setItemToDelete(doc);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(itemToDelete.id);
    try {
      await deleteDocument(itemToDelete.id);
      toast({ title: "Dokumen berhasil dihapus." });
      fetchDocuments();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: (error as Error).message });
    } finally {
      setIsDeleting(null);
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Dokumen</h1>
            <p className="text-muted-foreground">Unggah dan kelola dokumen penting untuk anggota.</p>
          </div>
          <Button onClick={() => router.push('/panel/documents/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Unggah Dokumen
          </Button>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Dokumen</CardTitle>
              <CardDescription>Total {documents.length} dokumen ditemukan.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/panel/documents/categories')}>
                <Tags className="mr-2 h-4 w-4" />
                Kelola Kategori
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tanggal Unggah</TableHead>
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
                      </TableCell>
                      <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                      <TableCell>{format(item.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!!isDeleting}>
                              {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setQrDialogItem(item)}>
                                <QrCode className="mr-2 h-4 w-4" /> Lihat QR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/panel/documents/edit/${item.id}`)}>Edit</DropdownMenuItem>
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
                      Belum ada dokumen yang diunggah.
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
    </>
  );
}
