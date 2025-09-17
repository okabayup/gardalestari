
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MemberWithStatus } from '@/app/actions/members';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

interface ViewVerificationDialogProps {
  member: MemberWithStatus;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewVerificationDialog({ member, isOpen, onClose }: ViewVerificationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Verifikasi: {member.name}</DialogTitle>
          <DialogDescription>
            Tinjau dokumen yang diunggah oleh anggota untuk verifikasi.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div>
                        <Label>Nama Lengkap</Label>
                        <p className="font-semibold">{member.name}</p>
                    </div>
                    <div>
                        <Label>NIK</Label>
                        <p className="font-mono">{member.nik}</p>
                    </div>
                    <div>
                        <Label>Nomor Telepon</Label>
                        <p className="font-mono">{member.phoneNumber}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label>Foto KTP</Label>
                        {member.ktpImageUrl ? (
                            <a href={member.ktpImageUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={member.ktpImageUrl} alt="Foto KTP" width={200} height={125} className="rounded-lg border object-cover hover:opacity-80 transition-opacity" />
                            </a>
                        ) : <p className="text-sm text-muted-foreground">Tidak tersedia</p>}
                    </div>
                    <div>
                        <Label>Foto Selfie</Label>
                        {member.selfieImageUrl ? (
                            <a href={member.selfieImageUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={member.selfieImageUrl} alt="Foto Selfie" width={200} height={125} className="rounded-lg border object-cover hover:opacity-80 transition-opacity" />
                            </a>
                        ) : <p className="text-sm text-muted-foreground">Tidak tersedia</p>}
                    </div>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
