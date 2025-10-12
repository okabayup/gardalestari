
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument } from '@/lib/definitions';
import { Check, Loader2, Grab, Maximize, RotateCw } from 'lucide-react';
import PdfViewer from '@/components/utils/PdfViewer';
import QRCode from 'qrcode.react';
import { Rnd } from 'react-rnd';
import { generateDocumentNumber } from '@/app/actions/documents';
import { useToast } from '@/hooks/use-toast';

interface DocumentStampingDialogProps {
  document: ImportantDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stamp: { x: number; y: number; width: number; height: number; rotation: number }) => void;
}

export default function DocumentStampingDialog({ document, isOpen, onClose, onConfirm }: DocumentStampingDialogProps) {
  const [stamp, setStamp] = useState({
    x: 100,
    y: 500,
    width: 120,
    height: 140, // Increase height to accommodate text
    rotation: 0,
  });
  const [loading, setLoading] = useState(false);
  const [documentNumber, setDocumentNumber] = useState<string | null>(null);
  const { toast } = useToast();
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset stamp position and fetch document number when a new document is opened
    if (isOpen && document) {
      setStamp({ x: 100, y: 500, width: 120, height: 140, rotation: 0 });
      const fetchDocNumber = async () => {
          try {
              const number = await generateDocumentNumber(document.type);
              setDocumentNumber(number);
          } catch (e) {
              toast({ variant: 'destructive', title: 'Gagal Membuat Nomor Surat' });
          }
      };
      fetchDocNumber();
    }
  }, [isOpen, document, toast]);

  if (!document) return null;
  
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/dokumen/verifikasi/${document.id}` : '';

  const handleConfirm = () => {
    if (!documentNumber) {
        toast({variant: 'destructive', title: 'Nomor surat belum dibuat. Coba lagi.'});
        return;
    }
    setLoading(true);
    // Pass the final stamp state to the parent
    onConfirm(stamp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Tanda Tangani &amp; Sahkan Dokumen</DialogTitle>
          <DialogDescription>
            Posisikan stempel QR di lokasi yang benar, lalu klik "Selesaikan &amp; Sahkan". Anda dapat memperbesar stempel.
          </DialogDescription>
        </DialogHeader>
        <div ref={pdfContainerRef} className="flex-1 border-y relative overflow-hidden bg-muted/30">
          <div className="absolute inset-0">
            <PdfViewer file={document.fileUrl} />
          </div>
          <Rnd
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed hsl(var(--primary))',
              background: 'rgba(255,255,255,0.8)',
            }}
            size={{ width: stamp.width, height: stamp.height }}
            position={{ x: stamp.x, y: stamp.y }}
            onDragStop={(e, d) => { setStamp(prev => ({...prev, x: d.x, y: d.y })) }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setStamp(prev => ({
                ...prev,
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
                ...position,
              }));
            }}
            bounds="parent"
          >
            <div className="relative w-full h-full p-2 flex flex-col items-center justify-center gap-1 text-center">
              {verificationUrl && <QRCode value={verificationUrl} size={Math.min(stamp.width, stamp.height) - 40} bgColor="transparent" fgColor="#000" />}
              <p className="text-[6px] font-mono leading-tight break-all">
                {documentNumber || 'Memuat nomor...'}
              </p>
            </div>
             <div className="absolute -top-6 -right-6 text-primary opacity-50 p-1 cursor-grab" title="Pindahkan">
                <Grab className="h-4 w-4" />
            </div>
          </Rnd>
        </div>
        <DialogFooter className="sm:justify-between p-6 pt-4">
            <div className="text-xs text-muted-foreground">
                Posisikan QR code dengan benar sebelum mengesahkan.
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Batal</Button>
                <Button onClick={handleConfirm} disabled={loading || !documentNumber}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                    Selesaikan &amp; Sahkan
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
