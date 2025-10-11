

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDocument, ImportantDocument } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, CheckCircle, XCircle, FileQuestion } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

const VerificationStatus = ({
  icon: Icon,
  title,
  description,
  variant,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  variant: 'success' | 'error';
}) => {
  const color = variant === 'success' ? 'text-green-600' : 'text-red-600';
  const bgColor = variant === 'success' ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className={`p-6 rounded-lg text-center ${bgColor} ${color}`}>
      <Icon className="h-12 w-12 mx-auto mb-4" />
      <h2 className="text-xl font-bold">{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default function DocumentVerificationPage() {
  const params = useParams();
  const docId = params.id as string;
  const [document, setDocument] = useState<ImportantDocument | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (docId) {
      getDocument(docId)
        .then(async (doc) => {
          if (doc && doc.status === 'Disetujui' && doc.approvedAt) {
            setDocument(doc);
            const { id } = await import('date-fns/locale/id');
            setFormattedDate(format(doc.approvedAt.toDate(), 'dd MMMM yyyy, HH:mm', { locale: id }));
          } else if (doc) {
             setError('Dokumen ini belum disahkan atau statusnya tidak valid.');
          }
          else {
            setError('Dokumen dengan ID ini tidak ditemukan.');
          }
        })
        .catch(() => setError('Gagal mengambil data dokumen.'))
        .finally(() => setLoading(false));
    }
  }, [docId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
       <div className="w-full max-w-2xl space-y-4">
         <div className="text-center mb-6">
            <Link href="/" className="inline-block">
                <Image src="/logo.png" alt="Garda Lestari Logo" width={160} height={42} className="h-auto w-40" />
            </Link>
        </div>

        <Card className="shadow-lg">
            <CardHeader className="text-center">
                <CardTitle>Verifikasi Keaslian Dokumen</CardTitle>
                <CardDescription>Halaman ini mengonfirmasi keabsahan dokumen digital yang dikeluarkan oleh Garda Lestari.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <VerificationStatus icon={XCircle} title="Verifikasi Gagal" description={error} variant="error" />
                ) : document ? (
                    <div className="space-y-4">
                        <VerificationStatus icon={CheckCircle} title="Dokumen Terverifikasi" description="Dokumen ini adalah asli dan tercatat dalam sistem kami." variant="success" />
                        <Card className="bg-background">
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Judul Dokumen</p>
                                    <p className="font-semibold">{document.title}</p>
                                </div>
                                {document.documentNumber && (
                                     <div>
                                        <p className="text-sm text-muted-foreground">Nomor Surat</p>
                                        <p className="font-mono">{document.documentNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">Disahkan oleh</p>
                                    <p className="font-semibold">{document.approvedByName}</p>
                                    <p className="text-xs text-muted-foreground">{document.approvedByPosition}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tanggal Pengesahan</p>
                                    <p className="font-semibold">{formattedDate} WIB</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Button asChild size="lg" className="w-full">
                            <Link href={document.fileUrl} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                Unduh Dokumen Digital untuk Membandingkan
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <VerificationStatus icon={FileQuestion} title="Status Tidak Diketahui" description="Tidak dapat memverifikasi dokumen saat ini." variant="error" />
                )}
            </CardContent>
        </Card>
         <div className="text-center text-xs text-muted-foreground pt-2">
            &copy; {new Date().getFullYear()} Garda Muda Lestari.
         </div>
       </div>
    </div>
  );
}
