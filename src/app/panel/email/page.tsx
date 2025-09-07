
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Mail } from 'lucide-react';
import Link from 'next/link';

const mxRecords = [
  { priority: 1, value: 'ASPMX.L.GOOGLE.COM' },
  { priority: 5, value: 'ALT1.ASPMX.L.GOOGLE.COM' },
  { priority: 5, value: 'ALT2.ASPMX.L.GOOGLE.COM' },
  { priority: 10, value: 'ALT3.ASPMX.L.GOOGLE.COM' },
  { priority: 10, value: 'ALT4.ASPMX.L.GOOGLE.COM' },
];

export default function EmailManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Panduan Konfigurasi Email Profesional</h1>
        <p className="text-muted-foreground">Gunakan domain Anda untuk membuat alamat email profesional (contoh: nama@gardalestari.org).</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Pemberitahuan Penting</AlertTitle>
        <AlertDescription>
          Fitur ini hanya menyediakan panduan. Garda Lestari **tidak** menyediakan layanan hosting email. Anda perlu menggunakan layanan pihak ketiga seperti Google Workspace atau Zoho Mail dan mengonfigurasinya melalui penyedia domain Anda.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Langkah 1: Pilih Penyedia Layanan Email</CardTitle>
          <CardDescription>
            Anda memerlukan layanan email bisnis untuk menggunakan domain kustom. Berikut beberapa rekomendasi populer:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <p><Link href="https://workspace.google.com/" target="_blank" className="font-semibold text-primary hover:underline">Google Workspace</Link>: Sangat direkomendasikan jika Anda sudah terbiasa dengan Gmail. Berbayar.</p>
            <p><Link href="https://www.zoho.com/mail/" target="_blank" className="font-semibold text-primary hover:underline">Zoho Mail</Link>: Menawarkan paket gratis untuk hingga 5 pengguna, pilihan bagus untuk memulai.</p>
             <p><Link href="https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products" target="_blank" className="font-semibold text-primary hover:underline">Microsoft 365 Business</Link>: Pilihan solid jika Anda menggunakan ekosistem Microsoft.</p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Langkah 2: Konfigurasi DNS di Penyedia Domain Anda</CardTitle>
          <CardDescription>
            Setelah mendaftar ke layanan email, Anda harus memperbarui catatan DNS (Domain Name System) di tempat Anda membeli domain. Ini memberitahu internet cara mengirim email ke alamat Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold mb-2">A. Catatan MX (Mail Exchange)</h3>
                <p className="text-sm text-muted-foreground mb-2">Catatan ini mengarahkan email ke server penyedia Anda. Hapus catatan MX yang ada dan tambahkan yang baru. Berikut adalah contoh untuk Google Workspace:</p>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Prioritas</TableHead>
                        <TableHead>Nilai / Tujuan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mxRecords.map(record => (
                            <TableRow key={record.value}>
                                <TableCell>{record.priority}</TableCell>
                                <TableCell className="font-mono">{record.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div>
                <h3 className="font-semibold mb-2">B. Catatan SPF (Sender Policy Framework)</h3>
                <p className="text-sm text-muted-foreground mb-2">Catatan TXT ini membantu mencegah spoofing dengan memverifikasi server mana yang diizinkan mengirim email atas nama domain Anda.</p>
                <div className="p-2 bg-muted rounded-md text-sm font-mono">v=spf1 include:_spf.google.com ~all</div>
            </div>
             <div>
                <h3 className="font-semibold mb-2">C. Catatan DKIM (DomainKeys Identified Mail)</h3>
                <p className="text-sm text-muted-foreground mb-2">Penyedia email Anda akan memberikan kunci DKIM unik setelah Anda menambahkan domain. Ini adalah catatan TXT lain yang menambahkan tanda tangan digital ke email Anda, meningkatkan keamanan.</p>
                 <div className="p-2 bg-muted rounded-md text-sm font-mono">
                    <p className="font-semibold">Nama Host/TXT:</p>
                    <p>google._domainkey</p>
                    <p className="font-semibold mt-2">Nilai:</p>
                    <p className="truncate">v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgK...</p>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">Nilai di atas adalah contoh. Salin nilai yang tepat dari dasbor penyedia email Anda.</p>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Langkah 3: Buat Akun Email</CardTitle>
        </CardHeader>
         <CardContent>
            <p className="text-muted-foreground">Setelah DNS diperbarui (bisa memakan waktu hingga 48 jam), Anda dapat membuat akun email untuk pengurus (misalnya, `divisi.komunikasi@gardalestari.org`) melalui dasbor admin penyedia email Anda.</p>
        </CardContent>
      </Card>

    </div>
  );
}


