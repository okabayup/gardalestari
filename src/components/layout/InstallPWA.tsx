
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: 'Instalasi Berhasil',
        description: 'Aplikasi Garda Lestari telah ditambahkan ke layar utama Anda.',
      });
    }

    setInstallPrompt(null);
  };

  if (!installPrompt) {
    return null;
  }

  return (
      <div className="fixed bottom-20 z-50 w-full max-w-lg px-4 left-1/2 -translate-x-1/2">
        <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-lg border">
            <p className="text-sm font-medium">Instal aplikasi untuk akses cepat.</p>
            <Button size="sm" onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4" />
                Instal
            </Button>
        </div>
    </div>
  );
}
