'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument, SignatoryRole } from '@/lib/definitions';
import { Check, X, Loader2, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import PdfViewer from '@/components/utils/PdfViewer';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';


interface DocumentPreviewDialogProps {
  document: ImportantDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (role: SignatoryRole, isFinal: boolean) => void;
  onReject: () => void;
}

export default function DocumentPreviewDialog({ document, isOpen, onClose, onApprove, onReject }: DocumentPreviewDialogProps) {
  const [fileUrlToRender, setFileUrlToRender] = useState('');
  const [signerRole, setSignerRole] = useState<SignatoryRole>('Ketua Umum');
  const [isFinalSignature, setIsFinalSignature] = useState(false);

  useEffect(() => {
    if (document) {
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
            Periksa konten dokumen di bawah ini. Anda dapat menambahkan tanda tangan digital.
            {document.canvaUrl && (
                <span className="flex items-center gap-2 mt-2">
                    <LinkIcon className="h-4 w-4" />
                    <a href={document.canvaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        Buka Tautan Canva untuk Edit
                    </a>
                </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 border-t border-b overflow-hidden relative">
             <PdfViewer file={fileUrlToRender} />
        </div>

        <div className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
                <Label>Tanda Tangan Atas Nama:</Label>
                <Select value={signerRole} onValueChange={(v) => setSignerRole(v as SignatoryRole)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih jabatan penandatangan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Ketua Umum">Ketua Umum (L. Andri Saputro)</SelectItem>
                        <SelectItem value="Sekretaris">Sekretaris (Oka Bayu Pratama)</SelectItem>
                        <SelectItem value="Bendahara Umum">Bendahara Umum (Hj. Siti Rohmah)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2 pb-3">
                <Checkbox 
                    id="is-final" 
                    checked={isFinalSignature} 
                    onCheckedChange={(checked) => setIsFinalSignature(!!checked)} 
                />
                <Label htmlFor="is-final" className="cursor-pointer text-xs">Jadikan tanda tangan terakhir (Sahkan Dokumen)</Label>
            </div>
        </div>

        <DialogFooter className="sm:justify-between p-6 pt-4">
            <Button variant="destructive" onClick={onReject}>
                <X className="mr-2 h-4 w-4" /> Tolak Dokumen
            </Button>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>Tutup</Button>
                <Button onClick={() => onApprove(signerRole, isFinalSignature)}>
                    <Check className="mr-2 h-4 w-4" /> Bubuhkan Tanda Tangan
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
