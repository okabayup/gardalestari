
'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import MembershipCard from './MembershipCard';
import type { User } from 'firebase/auth';
import { Button } from '../ui/button';
import { toPng } from 'html-to-image';
import { Download, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

interface MembershipCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User & {
    verificationStatus?: 'unverified' | 'temporary' | 'permanent' | 'rejected';
    fullName?: string;
    username?: string;
    nik?: string;
    type?: 'pusat' | 'daerah' | 'cabang' | 'pembina';
    position?: string;
  };
}

export default function MembershipCardDialog({ isOpen, onClose, user }: MembershipCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/profile/${user.username}`;
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    // Give browser a moment to render image before converting
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const dataUrl = await toPng(cardRef.current, { 
            cacheBust: true,
            pixelRatio: 2,
            useCORS: true,
        });
        const link = document.createElement('a');
        link.download = `KTA-${user.username || 'GardaLestari'}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('oops, something went wrong!', err);
        toast({
            variant: 'destructive',
            title: 'Gagal Mengunduh',
            description: 'Terjadi kesalahan saat membuat gambar KTA. Coba lagi nanti.'
        })
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-4">
        <DialogHeader className="sr-only">
          <DialogTitle>Kartu Tanda Anggota</DialogTitle>
          <p>Tinjau atau unduh Kartu Tanda Anggota Elektronik Anda.</p>
        </DialogHeader>
        
        <div ref={cardRef}>
            <MembershipCard 
                name={user.displayName || 'Anggota'}
                photoUrl={user.photoURL || ''}
                memberId={getMemberId()}
                nik={user.nik}
                profileUrl={getProfileUrl()}
                memberType={user.type}
                joinDate={getJoinDate()}
                position={user.position || 'Anggota'}
            />
        </div>
         <div className="pt-4">
            <Button onClick={handleDownload} className="w-full" disabled={isDownloading}>
                {isDownloading ? 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                  <Download className="mr-2 h-4 w-4" />
                }
                {isDownloading ? 'Mengunduh...' : 'Unduh Kartu'}
                <Badge variant="secondary" className="ml-2">Uji Coba</Badge>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
