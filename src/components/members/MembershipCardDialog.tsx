
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MembershipCard from './MembershipCard';
import type { User } from 'firebase/auth';

interface MembershipCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User & {
    verificationStatus?: 'unverified' | 'temporary' | 'permanent' | 'rejected';
    fullName?: string;
    username?: string;
    nik?: string;
    type?: 'pusat' | 'daerah' | 'cabang' | 'pembina';
  };
}

export default function MembershipCardDialog({ isOpen, onClose, user }: MembershipCardDialogProps) {
  
  if (!user) return null;
  
  const getMemberId = () => {
    const year = user.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : new Date().getFullYear();
    const phoneSuffix = String(user.phoneNumber).slice(-6);
    return `GL-${year}-${phoneSuffix}`;
  }
  
  const getJoinDate = () => {
      if (!user.metadata.creationTime) return '';
      return new Date(user.metadata.creationTime).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-transparent border-none shadow-none max-w-sm p-0">
        <MembershipCard 
            name={user.displayName || 'Anggota'}
            photoUrl={user.photoURL || ''}
            memberId={getMemberId()}
            memberType={user.type}
            joinDate={getJoinDate()}
        />
      </DialogContent>
    </Dialog>
  );
}
