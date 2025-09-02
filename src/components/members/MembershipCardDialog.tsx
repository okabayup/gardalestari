
'use client';

import { useRef } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import MembershipCard from './MembershipCard';
import type { User } from 'firebase/auth';
import { Button } from '../ui/button';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
  
  const getProfileUrl = () => {
    // Make sure to use the correct domain in production
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/profile/${user.username}`;
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true });
        const link = document.createElement('a');
        link.download = `kta-${user.username}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('oops, something went wrong!', err);
        toast({
            variant: 'destructive',
            title: 'Gagal Mengunduh',
            description: 'Terjadi kesalahan saat membuat gambar KTA.'
        })
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-transparent border-none shadow-none max-w-sm p-0">
        <div ref={cardRef}>
            <MembershipCard 
                name={user.displayName || 'Anggota'}
                photoUrl={user.photoURL || ''}
                memberId={getMemberId()}
                nik={user.nik}
                profileUrl={getProfileUrl()}
                memberType={user.type}
                joinDate={getJoinDate()}
            />
        </div>
         <DialogFooter className="pt-4">
            <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Unduh Kartu
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
