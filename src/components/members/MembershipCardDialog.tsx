
'use client';

import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MembershipCard from './MembershipCard';
import type { User } from 'firebase/auth';
import { Button } from '../ui/button';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
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
    position?: string;
  };
}

export default function MembershipCardDialog({ isOpen, onClose, user }: MembershipCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user.photoURL) {
      setIsImageLoading(true);
      
      const convertImageToLocalUrl = async () => {
        try {
          // Fetch the image from the original URL
          const response = await fetch(user.photoURL as string);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const imageBlob = await response.blob();
          // Create a local URL for the blob
          const localUrl = URL.createObjectURL(imageBlob);
          setLocalPhotoUrl(localUrl);
        } catch (error) {
          console.error("Failed to fetch and create local URL for image:", error);
          // Fallback to original URL if fetching fails
          setLocalPhotoUrl(user.photoURL); 
          toast({
            variant: 'destructive',
            title: 'Gagal Memuat Gambar',
            description: 'Menggunakan gambar asli, unduhan mungkin gagal.'
          })
        } finally {
          setIsImageLoading(false);
        }
      };

      convertImageToLocalUrl();
    }

    // Cleanup function to revoke the object URL when the component unmounts or the dialog closes
    return () => {
      if (localPhotoUrl && localPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPhotoUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user.photoURL]);

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
    try {
        const dataUrl = await toPng(cardRef.current, { 
            cacheBust: true,
            pixelRatio: 2, // Increase quality
            // Filter out external stylesheets to prevent CORS errors with fonts
            filter: (node) => {
              if (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet') {
                  return false;
              }
              return true;
            }
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
      <DialogContent className="bg-transparent border-none shadow-none max-w-sm p-0">
         <DialogHeader>
          <DialogTitle>Kartu Tanda Anggota</DialogTitle>
          <p className="sr-only">Tinjau atau unduh Kartu Tanda Anggota Elektronik Anda.</p>
        </DialogHeader>
        <div ref={cardRef}>
            <MembershipCard 
                name={user.displayName || 'Anggota'}
                photoUrl={localPhotoUrl || ''} // Use the local URL
                memberId={getMemberId()}
                nik={user.nik}
                profileUrl={getProfileUrl()}
                memberType={user.type}
                joinDate={getJoinDate()}
                position={user.position || 'Anggota'}
            />
        </div>
         <DialogFooter className="pt-4">
            <Button onClick={handleDownload} className="w-full" disabled={isDownloading || isImageLoading}>
                {(isDownloading || isImageLoading) ? 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                  <Download className="mr-2 h-4 w-4" />
                }
                {isImageLoading ? 'Memuat Gambar...' : isDownloading ? 'Mengunduh...' : 'Unduh Kartu'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
