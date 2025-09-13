
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { ShieldAlert } from 'lucide-react';

export default function DeleteDataPage() {
  const WHATSAPP_LINK = "https://wa.me/6285144904161?text=Saya%20ingin%20mengajukan%20penghapusan%20data%20akun%20Garda%20Lestari%20saya.";
  const EMAIL_LINK = "mailto:halo@gardalestari.org?subject=Permintaan%20Penghapusan%20Data%20Akun";

  return (
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
              <CardTitle>Hak Anda Atas Data Anda</CardTitle>
              <CardDescription>
                Kami menghormati privasi Anda dan memberikan Anda kontrol penuh atas data pribadi Anda. Anda berhak untuk meminta penghapusan total akun dan semua data yang terkait dengannya dari sistem kami.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Data Apa yang Akan Dihapus?</h3>
                <p className="text-sm text-muted-foreground">
                  Ketika Anda mengajukan permintaan penghapusan, kami akan menghapus semua informasi pribadi Anda secara permanen, termasuk namun tidak terbatas pada:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Informasi profil (Nama, NIK, nomor telepon, foto profil).</li>
                  <li>Data verifikasi (Foto KTP dan selfie).</li>
                  <li>Semua postingan, komentar, dan ide yang telah Anda buat.</li>
                  <li>Riwayat aktivitas dan data lainnya yang terhubung langsung ke akun Anda.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Prosedur Penghapusan</h3>
                <p className="text-sm text-muted-foreground">
                  Untuk memulai proses penghapusan data, silakan hubungi kami melalui salah satu metode di bawah ini. Tim kami akan memverifikasi identitas Anda untuk memastikan keamanan sebelum melanjutkan proses penghapusan.
                </p>
                 <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <Button asChild className="w-full">
                    <Link href={EMAIL_LINK}>
                      Kirim Permintaan via Email
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full">
                     <Link href={WHATSAPP_LINK} target="_blank">
                      Hubungi via WhatsApp
                    </Link>
                  </Button>
                </div>
                 <p className="text-xs text-muted-foreground mt-4">
                  Proses penghapusan data akan diselesaikan dalam waktu 7-14 hari kerja setelah verifikasi kepemilikan akun berhasil dilakukan. Setelah data dihapus, tindakan ini tidak dapat diurungkan.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
