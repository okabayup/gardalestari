
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument } from '@/lib/definitions';
import { Check, Loader2, QrCode } from 'lucide-react';
import PdfViewer from '@/components/utils/PdfViewer';
import { Rnd } from 'react-rnd';
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
    height: 140,
    rotation: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset stamp position when a new document is opened
    if (isOpen && document) {
      setStamp({ x: 100, y: 500, width: 120, height: 140, rotation: 0 });
    }
  }, [isOpen, document]);

  if (!document) return null;

  const handleConfirm = () => {
    setLoading(true);
    onConfirm(stamp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Tanda Tangani &amp; Sahkan Dokumen</DialogTitle>
          <DialogDescription>
            Posisikan area stempel di lokasi yang benar, lalu klik "Selesaikan &amp; Sahkan".
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 border-y relative overflow-hidden bg-muted/30">
          <div className="absolute inset-0">
            <PdfViewer file={document.fileUrl} />
          </div>
          <Rnd
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed hsl(var(--primary))',
              background: 'hsla(var(--primary) / 0.1)',
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
            <div className="relative w-full h-full p-2 flex flex-col items-center justify-center gap-1 text-center text-primary/80 cursor-grab active:cursor-grabbing">
              <QrCode className="h-10 w-10" />
              <p className="text-[8px] font-mono leading-tight break-all">
                Area Stempel QR & Nomor Surat
              </p>
            </div>
          </Rnd>
        </div>
        <DialogFooter className="sm:justify-between p-6 pt-4">
            <div className="text-xs text-muted-foreground">
                Anda dapat memindahkan, memperbesar, dan memutar area stempel.
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Batal</Button>
                <Button onClick={handleConfirm} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                    Selesaikan &amp; Sahkan
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
