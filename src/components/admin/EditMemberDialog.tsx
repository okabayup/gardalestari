
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { MemberWithStatus, MemberType, VerificationStatus } from '@/app/actions/members';
import { getPositions, Position } from '@/app/actions/positions';

interface EditMemberDialogProps {
  member: MemberWithStatus;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, details: { positionId?: string, type?: MemberType, region?: string, verificationStatus?: VerificationStatus, isSpecialMember?: boolean }) => void;
  isSaving: boolean;
}

const memberTypes: { value: MemberType, label: string }[] = [
  { value: 'pusat', label: 'Pengurus Pusat' },
  { value: 'daerah', label: 'Pengurus Daerah' },
  { value: 'cabang', label: 'Pengurus Cabang' },
  { value: 'pembina', label: 'Dewan Pembina' },
];

const verificationStatuses: { value: VerificationStatus, label: string }[] = [
    { value: 'unverified', label: 'Belum Terverifikasi'},
    { value: 'temporary', label: 'Menunggu Persetujuan'},
    { value: 'permanent', label: 'Permanen'},
    { value: 'rejected', label: 'Ditolak'},
];

// Use a non-empty string for the "no position" value.
const NO_POSITION_VALUE = "NONE";

export default function EditMemberDialog({ member, isOpen, onClose, onSave, isSaving }: EditMemberDialogProps) {
  const [positionId, setPositionId] = useState(member.positionId || NO_POSITION_VALUE);
  const [type, setType] = useState<MemberType | 'anggota' | undefined>(member.type || 'anggota');
  const [region, setRegion] = useState(member.region || '');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(member.verificationStatus || 'unverified');
  const [isSpecialMember, setIsSpecialMember] = useState(member.isSpecialMember || false);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    getPositions().then(setPositions);
  }, []);

  useEffect(() => {
    if (isOpen) {
        setPositionId(member.positionId || NO_POSITION_VALUE);
        setType(member.type || 'anggota');
        setRegion(member.region || '');
        setVerificationStatus(member.verificationStatus || 'unverified');
        setIsSpecialMember(member.isSpecialMember || false);
    }
  }, [member, isOpen]);
  
  useEffect(() => {
    if (type !== 'daerah') {
      setRegion('');
    }
  }, [type]);

  const handleSave = () => {
    const detailsToSave: { positionId?: string, type?: MemberType, region?: string, verificationStatus?: VerificationStatus, isSpecialMember?: boolean } = {
        positionId: positionId === NO_POSITION_VALUE ? undefined : positionId,
        type: type === 'anggota' ? undefined : type,
        region: region,
        verificationStatus: verificationStatus,
        isSpecialMember: isSpecialMember,
    };
    onSave(member.id, detailsToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Anggota: {member.name}</DialogTitle>
          <DialogDescription>
            Atur jabatan, jenis keanggotaan, dan status untuk pengguna ini.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="position">Jabatan</Label>
            <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger id="position">
                    <SelectValue placeholder="Pilih Jabatan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NO_POSITION_VALUE}>Anggota Biasa</SelectItem>
                    {positions.map(p => (
                        <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Jenis Keanggotaan</Label>
            <Select value={type} onValueChange={(value) => setType(value as MemberType | 'anggota')}>
                <SelectTrigger id="type">
                    <SelectValue placeholder="Pilih Jenis Keanggotaan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="anggota">Anggota Biasa</SelectItem>
                    {memberTypes.map(mt => (
                        <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          {type === 'daerah' && (
             <div className="space-y-2">
                <Label htmlFor="region">Wilayah/Daerah</Label>
                <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Contoh: Jawa Barat"
                />
            </div>
          )}
           <div className="space-y-2">
            <Label htmlFor="verificationStatus">Status Verifikasi</Label>
            <Select value={verificationStatus} onValueChange={(value) => setVerificationStatus(value as VerificationStatus)}>
                <SelectTrigger id="verificationStatus">
                    <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                    {verificationStatuses.map(vs => (
                        <SelectItem key={vs.value} value={vs.value}>{vs.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="special-member"
                checked={isSpecialMember}
                onCheckedChange={setIsSpecialMember}
              />
              <Label htmlFor="special-member">Jadikan Anggota Istimewa (Hak Suara Khusus)</Label>
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
