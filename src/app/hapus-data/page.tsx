'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { requestDataDeletion } from '@/app/actions/user';
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

const ADMIN_CONTACT_WA = "https://wa.me/6285144904161?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20mengenai%20penghapusan%20data.";

export default function DeleteDataPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestDeletion = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await requestDataDeletion(user.uid);
      setRequestSent(true);
      toast({
        title: 'Permintaan Terkirim',
        description: 'Permintaan penghapusan data Anda telah dikirim ke admin untuk ditinjau.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Permintaan',
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };
  
  const renderContent = () => {
    if (authLoading) {
      return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (requestSent) {
       return (
          <div className="text-center space-y-4">
              <h3 className="font-semibold">Permintaan Anda Telah Diterima</h3>
              <p className="text-sm text-muted-foreground">
                Tim kami akan meninjau permintaan Anda. Proses penghapusan data akan diselesaikan dalam 7-14 hari kerja. Anda dapat keluar dari akun Anda sekarang.
              </p>
          </div>
       );
    }

    if (!user) {
      return (
        <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
                Anda harus masuk untuk dapat mengajukan permintaan penghapusan data.
            </p>
            <Button asChild>
                <Link href="/login">Masuk ke Akun Anda</Link>
            </Button>
        </div>
      );
    }
    
    return (
        <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk memulai proses pengajuan penghapusan akun dan semua data terkait Anda. Tindakan ini tidak dapat diurungkan setelah disetujui oleh admin.
            </p>
             <Button variant="destructive" onClick={() => setShowConfirmDialog(true)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Ajukan Penghapusan Data Saya
            </Button>
        </div>
    );
  }

  return (
    <>
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h1 className="font-headline text-3xl font-bold">Penghapusan Data Pengguna</h1>
            <p className="text-muted-foreground mt-2">Prosedur untuk mengajukan penghapusan akun dan data terkait.</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Prosedur Penghapusan</CardTitle>
              <CardDescription>
                Kami menghormati privasi Anda. Ikuti langkah di bawah ini untuk mengajukan penghapusan akun dan data Anda secara permanen dari sistem kami.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Data Apa yang Akan Dihapus?</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Informasi profil (Nama, NIK, nomor telepon, foto profil).</li>
                  <li>Data verifikasi (Foto KTP dan selfie).</li>
                  <li>Semua postingan, komentar, dan ide yang telah Anda buat.</li>
                  <li>Riwayat aktivitas dan data lainnya yang terhubung langsung ke akun Anda.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Langkah Pengajuan</h3>
                {renderContent()}
              </div>

              <div className="pt-4 border-t text-center">
                <Button variant="link" asChild className="text-muted-foreground">
                    <Link href={ADMIN_CONTACT_WA} target="_blank">Butuh bantuan teknis? Hubungi Admin</Link>
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>

    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin sepenuhnya?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini adalah langkah terakhir. Setelah Anda mengajukan, permintaan akan dikirim ke admin. Jika disetujui, semua data Anda, termasuk akun login Anda, akan <span className="font-bold text-destructive">dihapus secara permanen</span> dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestDeletion} className="bg-destructive hover:bg-destructive/90">
              Ya, Saya Mengerti & Ingin Melanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}