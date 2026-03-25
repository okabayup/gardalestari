'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import { getDocument, ImportantDocument } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Download, CheckCircle, XCircle, FileQuestion, UploadCloud, ShieldAlert, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { readDocumentText } from '@/ai/flows/ocr-pdf-flow';
import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Dynamically import PdfViewer to prevent SSR issues with react-pdf/pdfjs-dist
const PdfViewer = dynamic(() => import('@/components/utils/PdfViewer'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});

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
      <p className="text-sm">{description}</p>
    </div>
  );
};

const ComparisonDialog = ({
  isOpen,
  onClose,
  officialUrl,
  uploadedUrl,
  ocrResult,
  loadingOcr
}: {
  isOpen: boolean;
  onClose: () => void;
  officialUrl: string;
  uploadedUrl: string;
  ocrResult: { match: boolean, message: string } | null;
  loadingOcr: boolean;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bandingkan Dokumen</DialogTitle>
           <DialogDescription>
             Bandingkan versi resmi (kiri) dengan dokumen yang Anda unggah (kanan).
          </DialogDescription>
        </DialogHeader>
         <div className="p-4 rounded-md border text-sm" style={ocrResult ? (ocrResult.match ? {borderColor: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary)/0.1)'} : {borderColor: 'hsl(var(--destructive))', backgroundColor: 'hsl(var(--destructive)/0.1)'}) : {}}>
            <div className="flex items-center gap-2">
                {loadingOcr ? <Loader2 className="h-4 w-4 animate-spin"/> : (ocrResult?.match ? <CheckCircle className="h-4 w-4 text-primary"/> : <ShieldAlert className="h-4 w-4 text-destructive"/>)}
                <span className="font-semibold">{loadingOcr ? "Membandingkan isi teks..." : (ocrResult ? `Hasil Perbandingan OCR: ${ocrResult.match ? 'Cocok' : 'Tidak Cocok'}` : "Menunggu perbandingan...")}</span>
            </div>
            {ocrResult && <p className="text-xs text-muted-foreground mt-1">{ocrResult.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-auto">
          <div className="border rounded-md overflow-hidden relative">
            <PdfViewer file={officialUrl} />
          </div>
          <div className="border rounded-md overflow-hidden relative">
             <PdfViewer file={uploadedUrl} />
          </div>
        </div>
        <DialogFooter className="p-4 border-t">
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentVerificationPage() {
  const params = useParams();
  const docId = params.id as string;
  const { toast } = useToast();
  const [document, setDocument] = useState<ImportantDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isComparing, setIsComparing] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ match: boolean, message: string } | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (docId) {
      getDocument(docId)
        .then(async (doc) => {
          if (doc && doc.status === 'Disetujui') {
            setDocument(doc);
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

  const handleFileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && document?.fileUrl) {
      if (file.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: 'File tidak valid', description: 'Mohon unggah file PDF.' });
        return;
      }
      
      const uploadedDataUri = await handleFileToDataUri(file);
      
      setUploadedFileUrl(URL.createObjectURL(file));
      setIsComparing(true);
      setLoadingOcr(true);
      setOcrResult(null);

      try {
        const uploadedTextResult = await readDocumentText({ fileDataUri: uploadedDataUri });
        const cleanUploadedText = uploadedTextResult.text.replace(/\s+/g, ' ').trim();

        if (document.originalContent === cleanUploadedText) {
          setOcrResult({ match: true, message: 'Isi teks dari dokumen yang diunggah identik dengan dokumen asli sebelum penandatanganan.' });
        } else {
          setOcrResult({ match: false, message: 'Isi teks dari dokumen yang diunggah berbeda dengan dokumen asli. Dokumen mungkin telah diubah.' });
        }
      } catch (ocrError) {
        console.error("OCR Comparison Error:", ocrError);
        setOcrResult({ match: false, message: 'Gagal membandingkan isi dokumen.' });
      } finally {
        setLoadingOcr(false);
      }
    }
  };

  const handleComparisonClose = () => {
    setIsComparing(false);
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <>
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
                    <div className="space-y-6">
                        <VerificationStatus icon={CheckCircle} title="Dokumen Terverifikasi" description="Dokumen ini adalah asli dan tercatat dalam sistem resmi Garda Lestari." variant="success" />
                        
                        <div className="aspect-[4/5] w-full bg-gray-200 rounded-lg overflow-hidden border shadow-inner relative">
                           <PdfViewer file={document.fileUrl} />
                        </div>
                        
                        <Card className="bg-background border-primary/20">
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Perihal Dokumen</p>
                                        <p className="font-semibold text-primary">{document.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Nomor Surat</p>
                                        <p className="font-mono text-sm font-bold">{document.documentNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserCheck className="h-4 w-4 text-primary" />
                                        <p className="text-sm font-bold">Data Penandatangan Digital:</p>
                                    </div>
                                    {document.signers && document.signers.length > 0 ? (
                                        <Accordion type="single" collapsible className="w-full">
                                            {document.signers.map((signer, index) => (
                                                <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-4 mb-2 bg-muted/20">
                                                    <AccordionTrigger className="hover:no-underline py-3">
                                                        <div className="flex flex-col items-start text-left">
                                                            <span className="font-semibold text-sm">{signer.name}</span>
                                                            <span className="text-xs text-muted-foreground">{signer.role}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-3 text-xs space-y-2 border-t pt-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Status Verifikasi:</span>
                                                            <Badge className="bg-green-600 text-white text-[10px] h-5">TERVERIFIKASI</Badge>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Waktu Tanda Tangan:</span>
                                                            <span className="font-mono">{format(new Date(signer.signedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })} WIB</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-2 italic leading-tight">
                                                            * Penandatanganan ini menggunakan infrastruktur kunci publik Garda Lestari dan memiliki kekuatan hukum internal yang sah.
                                                        </p>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    ) : (
                                        <div className="p-4 rounded-md border border-dashed text-center text-sm text-muted-foreground">
                                            Data penandatangan tidak ditemukan.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                         <div className="grid grid-cols-2 gap-4">
                            <Button asChild size="lg" className="w-full">
                                <Link href={document.fileUrl} target="_blank">
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF
                                </Link>
                            </Button>
                            <Button size="lg" className="w-full" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Bandingkan
                            </Button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                        </div>
                    </div>
                ) : (
                    <VerificationStatus icon={FileQuestion} title="Status Tidak Diketahui" description="Tidak dapat memverifikasi dokumen saat ini." variant="error" />
                )}
            </CardContent>
        </Card>
         <div className="text-center text-[10px] text-muted-foreground pt-4 opacity-60">
            &copy; {new Date().getFullYear()} Garda Muda Lestari. Verifikasi Dokumen Kriptografis v2.0
         </div>
       </div>
    </div>
    {isComparing && document && uploadedFileUrl && (
        <ComparisonDialog
            isOpen={isComparing}
            onClose={handleComparisonClose}
            officialUrl={document.fileUrl}
            uploadedUrl={uploadedFileUrl}
            ocrResult={ocrResult}
            loadingOcr={loadingOcr}
        />
    )}
    </>
  );
}