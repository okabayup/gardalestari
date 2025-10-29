

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument } from '@/lib/definitions';
import { Check, X, Loader2 } from 'lucide-react';
import PdfViewer from '@/components/utils/PdfViewer';
import { useEffect, useState } from 'react';


interface DocumentPreviewDialogProps {
  document: ImportantDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function DocumentPreviewDialog({ document, isOpen, onClose, onApprove, onReject }: DocumentPreviewDialogProps) {
  const [fileUrlToRender, setFileUrlToRender] = useState('');

  useEffect(() => {
    if (document) {
      // Add a timestamp to the URL to bypass browser cache
      setFileUrlToRender(`${document.fileUrl}?t=${new Date().getTime()}`);
    }
  }, [document]);

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Tinjau Dokumen: {document.title}</DialogTitle>
          <DialogDescription>
            Periksa konten dokumen di bawah ini sebelum memberikan persetujuan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 border-t border-b overflow-hidden">
             <PdfViewer file={fileUrlToRender} />
        </div>
        <DialogFooter className="sm:justify-between p-6 pt-4">
            <Button variant="destructive" onClick={onReject}>
                <X className="mr-2 h-4 w-4" /> Tolak
            </Button>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Tutup</Button>
                <Button onClick={onApprove}>
                    <Check className="mr-2 h-4 w-4" /> Setujui & Sahkan Digital
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
