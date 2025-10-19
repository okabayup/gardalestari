

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createReport } from '@/app/actions/reports';
import { useAuth } from '@/hooks/use-auth';
import type { ReportType, ReportReason } from '@/lib/definitions';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedItemId: string;
  reportedItemType: ReportType;
  reportedItemContent?: string;
}

const reportReasons: { value: ReportReason, label: string }[] = [
    { value: 'spam', label: 'Spam atau Promosi'},
    { value: 'scam', label: 'Penipuan'},
    { value: 'ujaran_kebencian', label: 'Ujaran Kebencian'},
    { value: 'pelecehan', label: 'Pelecehan atau Perundungan'},
    { value: 'konten_ilegal', label: 'Konten Ilegal atau Berbahaya'},
    { value: 'lainnya', label: 'Alasan Lainnya'},
];

export function ReportDialog({ isOpen, onClose, reportedItemId, reportedItemType, reportedItemContent }: ReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) {
      toast({ variant: 'destructive', title: 'Data tidak lengkap', description: 'Mohon pilih alasan pelaporan.' });
      return;
    }
    setLoading(true);
    try {
      await createReport(user.uid, reportedItemId, reportedItemType, reason, details, reportedItemContent);
      toast({ title: 'Laporan Terkirim', description: 'Terima kasih, laporan Anda akan segera kami tinjau.' });
      onClose();
      setReason(null);
      setDetails('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengirim Laporan', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan {reportedItemType === 'post' ? 'Postingan' : 'Pengguna'}</DialogTitle>
          <DialogDescription>
            Bantu kami menjaga komunitas tetap aman. Mengapa Anda melaporkan {reportedItemContent ? `"${reportedItemContent}"` : 'item ini'}?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Alasan Pelaporan</Label>
            <RadioGroup onValueChange={(value) => setReason(value as ReportReason)}>
              {reportReasons.map(r => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value}>{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          {reason === 'lainnya' && (
            <div className="space-y-2">
              <Label htmlFor="details">Detail Lainnya</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Jelaskan alasan Anda secara singkat..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!reason || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
