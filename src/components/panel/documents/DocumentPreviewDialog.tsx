
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument } from '@/lib/definitions';
import { Check, X, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the DocxViewer only on the client side
const DocxViewer = dynamic(() => import('@/components/utils/DocxViewer.client'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
  ssr: false, // This is crucial
});


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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Tinjau Dokumen: {document.title}</DialogTitle>
          <DialogDescription>
            Periksa konten dokumen di bawah ini sebelum memberikan persetujuan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 border-t border-b overflow-hidden">
             <DocxViewer fileUrl={document.fileUrl} />
        </div>
        <DialogFooter className="sm:justify-between p-6 pt-4">
            <Button variant="destructive" onClick={onReject}>
                <X className="mr-2 h-4 w-4" /> Tolak
            </Button>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Tutup</Button>
                <Button onClick={onApprove}>
                    <Check className="mr-2 h-4 w-4" /> Setujui
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
