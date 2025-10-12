
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument } from '@/lib/definitions';
import { Check, X } from 'lucide-react';

interface DocumentPreviewDialogProps {
  document: ImportantDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function DocumentPreviewDialog({ document, isOpen, onClose, onApprove, onReject }: DocumentPreviewDialogProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tinjau Dokumen: {document.title}</DialogTitle>
          <DialogDescription>
            Periksa konten dokumen di bawah ini sebelum memberikan persetujuan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 border rounded-md overflow-hidden">
             <iframe 
                src={`${document.fileUrl}#toolbar=0`} 
                className="w-full h-full border-0"
                title={`Pratinjau: ${document.title}`}
            ></iframe>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={onReject}>
                <X className="mr-2 h-4 w-4" /> Tolak
            </Button>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Tutup</Button>
                <Button onClick={onApprove}>
                    <Check className="mr-2 h-4 w-4" /> Setujui & Sahkan
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
