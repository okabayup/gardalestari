
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportantDocument, SignatoryRole } from '@/lib/definitions';
import { Check, X, Loader2, Link as LinkIcon, ShieldCheck, Calendar as CalendarIcon } from 'lucide-react';
import PdfViewer from '@/components/utils/PdfViewer';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';


interface DocumentPreviewDialogProps {
  document: ImportantDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (role: SignatoryRole, isFinal: boolean, customDate?: string) => void;
  onReject: () => void;
}

export default function DocumentPreviewDialog({ document, isOpen, onClose, onApprove, onReject }: DocumentPreviewDialogProps) {
  const [fileUrlToRender, setFileUrlToRender] = useState('');
  const [signerRole, setSignerRole] = useState<SignatoryRole>('Ketua Umum');
  const [isFinalSignature, setIsFinalSignature] = useState(false);
  
  const [signingDate, setSigningDate] = useState<Date>(new Date());
  const [signingTime, setSigningTime] = useState(format(new Date(), 'HH:mm'));

  useEffect(() => {
    if (document && document.fileUrl) {
      // Tambahkan timestamp untuk mematikan cache browser agar file baru langsung terlihat
      setFileUrlToRender(`${document.fileUrl}${document.fileUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
    } else {
      setFileUrlToRender('');
    }
  }, [document, isOpen]);

  if (!document) return null;

  const handleApproveClick = () => {
    const finalDate = new Date(signingDate);
    const [hours, minutes] = signingTime.split(':').map(Number);
    finalDate.setHours(hours, minutes);
    onApprove(signerRole, isFinalSignature, finalDate.toISOString());
  };

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
             {fileUrlToRender ? (
                <PdfViewer file={fileUrlToRender} />
             ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Memuat file...
                </div>
             )}
        </div>

        <div className="p-4 bg-muted/30 border-b space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
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
                <div className="space-y-2">
                    <Label>Tanggal & Waktu Tanda Tangan:</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(signingDate, 'dd/MM/yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={signingDate} onSelect={(d) => d && setSigningDate(d)} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Input 
                            type="time" 
                            value={signingTime} 
                            onChange={(e) => setSigningTime(e.target.value)} 
                            className="w-24"
                        />
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
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
                <Button onClick={handleApproveClick}>
                    <Check className="mr-2 h-4 w-4" /> Bubuhkan Tanda Tangan
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
