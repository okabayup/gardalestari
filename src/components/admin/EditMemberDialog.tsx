
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { MemberWithStatus } from '@/app/actions/members';
import { getPositions, Position } from '@/app/actions/positions';
import type { MemberType, VerificationStatus } from '@/lib/definitions';
import Image from 'next/image';

interface EditMemberDialogProps {
  member: MemberWithStatus;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, details: Partial<Omit<MemberWithStatus, 'id' | 'avatarUrl'>>, photoFile?: File) => void;
  isSaving: boolean;
}

const memberTypes: { value: MemberType, label: string }[] = [
  { value: 'pusat', label: 'DPP' },
  { value: 'daerah', label: 'DPD' },
  { value: 'cabang', label: 'DPC' },
  { value: 'pembina', label: 'Dewan Pembina' },
  { value: 'pengawas', label: 'Dewan Pengawas' },
  { value: 'penasehat', label: 'Dewan Penasehat' },
];

const verificationStatuses: { value: VerificationStatus, label: string }[] = [
    { value: 'unverified', label: 'Belum Terverifikasi'},
    { value: 'temporary', label: 'Menunggu Persetujuan'},
    { value: 'permanent', label: 'Permanen'},
    { value: 'rejected', label: 'Ditolak'},
];

const NO_POSITION_VALUE = "no-position"; 
const NO_TYPE_VALUE = "no-type";

export default function EditMemberDialog({ member, isOpen, onClose, onSave, isSaving }: EditMemberDialogProps) {
  const [positionId, setPositionId] = useState(member.positionId || NO_POSITION_VALUE);
  const [type, setType] = useState<MemberType | '' | 'no-type'>(member.type || NO_TYPE_VALUE);
  const [region, setRegion] = useState(member.region || '');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(member.verificationStatus || 'unverified');
  const [isSpecialMember, setIsSpecialMember] = useState(member.isSpecialMember || false);
  const [isHidden, setIsHidden] = useState(member.isHidden || false);
  const [titlePrefix, setTitlePrefix] = useState(member.titlePrefix || '');
  const [titlePostfix, setTitlePostfix] = useState(member.titlePostfix || '');
  const [positions, setPositions] = useState<Position[]>([]);
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    getPositions().then(setPositions);
  }, []);

  useEffect(() => {
    if (isOpen) {
        setPositionId(member.positionId || NO_POSITION_VALUE);
        setType(member.type || NO_TYPE_VALUE);
        setRegion(member.region || '');
        setVerificationStatus(member.verificationStatus || 'unverified');
        setIsSpecialMember(member.isSpecialMember || false);
        setIsHidden(member.isHidden || false);
        setTitlePrefix(member.titlePrefix || '');
        setTitlePostfix(member.titlePostfix || '');
        setPhotoPreview(member.avatarUrl || null);
        setPhotoFile(undefined);
    }
  }, [member, isOpen]);
  
  useEffect(() => {
    if (type !== 'daerah') {
      setRegion('');
    }
  }, [type]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }
  }

  const handleSave = () => {
    const detailsToSave: Partial<Omit<MemberWithStatus, 'id' | 'avatarUrl'>> = {
        positionId: positionId === NO_POSITION_VALUE ? '' : positionId,
        type: type === NO_TYPE_VALUE ? '' : (type as MemberType),
        region: region,
        verificationStatus: verificationStatus,
        isSpecialMember: isSpecialMember,
        isHidden: isHidden,
        titlePrefix: titlePrefix,
        titlePostfix: titlePostfix,
    };
    onSave(member.id, detailsToSave, photoFile);
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
           <div className="grid grid-cols-5 gap-2">
                <div className="space-y-2 col-span-1">
                    <Label htmlFor="titlePrefix">Gelar Depan</Label>
                    <Input id="titlePrefix" value={titlePrefix} onChange={e => setTitlePrefix(e.target.value)} />
                </div>
                 <div className="space-y-2 col-span-3">
                    <Label>Nama</Label>
                    <Input value={member.name} disabled />
                </div>
                <div className="space-y-2 col-span-1">
                    <Label htmlFor="titlePostfix">Gelar Belakang</Label>
                    <Input id="titlePostfix" value={titlePostfix} onChange={e => setTitlePostfix(e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="photoFile">Foto Profil</Label>
                {photoPreview && <Image src={photoPreview} alt="Pratinjau foto" width={80} height={80} className="rounded-full object-cover" />}
                <Input id="photoFile" type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
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
            <Select value={type} onValueChange={(value) => setType(value as MemberType | 'no-type')}>
                <SelectTrigger id="type">
                    <SelectValue placeholder="Pilih Jenis Keanggotaan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NO_TYPE_VALUE}>Anggota Biasa</SelectItem>
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
             <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is-hidden"
                checked={isHidden}
                onCheckedChange={setIsHidden}
              />
              <Label htmlFor="is-hidden">Sembunyikan dari Direktori Publik</Label>
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
