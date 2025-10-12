

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument } from '@/lib/definitions';
import { Check, Loader2, QrCode, Type, Trash2 } from 'lucide-react';
import PdfViewer from '@/components/utils/PdfViewer';
import { Rnd } from 'react-rnd';
import { useToast } from '@/hooks/use-toast';

interface DocumentStampingDialogProps {
  document: ImportantDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stamps: { 
    qrStamp: { x: number; y: number; width: number; height: number; rotation: number },
    numberStamp: { x: number; y: number; width: number; height: number; rotation: number }
  }) => void;
}

type Stamp = {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

export default function DocumentStampingDialog({ document, isOpen, onClose, onConfirm }: DocumentStampingDialogProps) {
  const [qrStamp, setQrStamp] = useState<Stamp | null>(null);
  const [numberStamp, setNumberStamp] = useState<Stamp | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset stamps when dialog opens
    if (isOpen) {
      setQrStamp(null);
      setNumberStamp(null);
    }
  }, [isOpen]);

  if (!document) return null;

  const handleConfirm = () => {
    if (!qrStamp || !numberStamp) {
        toast({ variant: 'destructive', title: 'Belum Lengkap', description: 'Anda harus menambahkan placeholder QR Code dan Nomor Surat.' });
        return;
    }
    setLoading(true);
    onConfirm({ qrStamp, numberStamp });
  };

  const addPlaceholder = (type: 'qr' | 'number') => {
      if (type === 'qr' && !qrStamp) {
          setQrStamp({ x: 100, y: 500, width: 80, height: 80, rotation: 0 });
      } else if (type === 'number' && !numberStamp) {
          setNumberStamp({ x: 100, y: 600, width: 150, height: 20, rotation: 0 });
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Tanda Tangani &amp; Sahkan Dokumen</DialogTitle>
          <DialogDescription>
            Klik tombol untuk menambahkan placeholder, lalu posisikan di lokasi yang benar. Anda dapat memindahkan, memperbesar, dan memutar area stempel.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 border-y relative overflow-hidden bg-muted/30">
          <div className="absolute inset-0">
            <PdfViewer file={document.fileUrl} />
          </div>
          {qrStamp && (
             <Rnd
                style={{ border: '2px dashed hsl(var(--primary))', background: 'hsla(var(--primary) / 0.1)' }}
                size={{ width: qrStamp.width, height: qrStamp.height }}
                position={{ x: qrStamp.x, y: qrStamp.y }}
                onDragStop={(e, d) => { setQrStamp(prev => prev ? {...prev, x: d.x, y: d.y } : null)}}
                onResizeStop={(e, direction, ref, delta, position) => {
                    setQrStamp(prev => prev ? {
                        ...prev,
                        width: parseInt(ref.style.width, 10),
                        height: parseInt(ref.style.height, 10),
                        ...position,
                    } : null);
                }}
                bounds="parent"
            >
                <div className="relative w-full h-full p-1 flex flex-col items-center justify-center gap-1 text-center text-primary/80 cursor-grab active:cursor-grabbing">
                    <QrCode className="h-6 w-6" />
                    <p className="text-[7px] font-mono leading-tight">Area QR Code</p>
                    <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-5 w-5 rounded-full" onClick={() => setQrStamp(null)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </Rnd>
          )}
           {numberStamp && (
             <Rnd
                style={{ border: '2px dashed hsl(var(--destructive))', background: 'hsla(var(--destructive) / 0.1)' }}
                size={{ width: numberStamp.width, height: numberStamp.height }}
                position={{ x: numberStamp.x, y: numberStamp.y }}
                onDragStop={(e, d) => { setNumberStamp(prev => prev ? {...prev, x: d.x, y: d.y } : null)}}
                onResizeStop={(e, direction, ref, delta, position) => {
                    setNumberStamp(prev => prev ? {
                        ...prev,
                        width: parseInt(ref.style.width, 10),
                        height: parseInt(ref.style.height, 10),
                        ...position,
                    } : null);
                }}
                bounds="parent"
            >
                <div className="relative w-full h-full p-1 flex flex-col items-center justify-center gap-1 text-center text-destructive/80 cursor-grab active:cursor-grabbing">
                    <Type className="h-4 w-4" />
                    <p className="text-[7px] font-mono leading-tight">Area Nomor Surat</p>
                    <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-5 w-5 rounded-full" onClick={() => setNumberStamp(null)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </Rnd>
          )}

        </div>
        <DialogFooter className="sm:justify-between p-6 pt-4">
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addPlaceholder('qr')} disabled={!!qrStamp}>
                    <QrCode className="mr-2 h-4 w-4"/> + Stempel QR
                </Button>
                 <Button variant="outline" size="sm" onClick={() => addPlaceholder('number')} disabled={!!numberStamp}>
                    <Type className="mr-2 h-4 w-4"/> + Nomor Surat
                </Button>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Batal</Button>
                <Button onClick={handleConfirm} disabled={loading || !qrStamp || !numberStamp}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                    Selesaikan & Sahkan
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
