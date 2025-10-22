
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';
import { getAppSettings } from '@/app/actions/settings';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=org.gardalestari.twa';

export default function InstallGate() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkConditions = async () => {
      const settings = await getAppSettings();
      
      if (!settings.isInstallForced) {
        return;
      }

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTwa = document.referrer.includes('android-app://');
      const hasSeenDialog = sessionStorage.getItem('hasSeenInstallGate');

      if (isMobile && !isTwa && !hasSeenDialog) {
        setShowDialog(true);
        sessionStorage.setItem('hasSeenInstallGate', 'true');
      }
    };
    
    checkConditions();
  }, []);

  return (
    <Dialog open={showDialog}>
      <DialogContent hideClose={true} onInteractOutside={(e) => e.preventDefault()} className="max-w-sm">
        <DialogHeader className="items-center text-center">
            <Image src="/logo.png" alt="Garda Lestari" width={120} height={32} className="mb-4" />
          <DialogTitle>Pengalaman Terbaik di Aplikasi</DialogTitle>
          <DialogDescription>
            Untuk pengalaman terbaik, silakan unduh dan instal aplikasi Garda Lestari langsung dari Google Play Store.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild className="w-full" size="lg">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4"/>
              Buka di Play Store
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
