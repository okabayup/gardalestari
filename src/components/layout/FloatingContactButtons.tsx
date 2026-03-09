'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function FloatingContactButtons() {
  const pathname = usePathname();
  const whatsappNumber = '6285144904161';
  const webcallUrl = 'https://asisten-lestari-webcall-625063745466.asia-southeast1.run.app';

  // Check if current page has a bottom navigation bar to adjust FAB height
  const hasBottomNav = !pathname.startsWith('/panel') && 
    (pathname.startsWith('/feed') || 
     pathname.startsWith('/members') || 
     pathname.startsWith('/programs') || 
     pathname.startsWith('/assistant') ||
     pathname.startsWith('/ideas') ||
     pathname.startsWith('/points') ||
     pathname.startsWith('/achievements') ||
     pathname.startsWith('/evoting') ||
     pathname.startsWith('/documents') ||
     pathname.startsWith('/announcements') ||
     pathname.startsWith('/recruitments') ||
     pathname.startsWith('/profile'));

  return (
    <div className={cn(
      "fixed right-4 z-50 flex flex-col gap-3 transition-all duration-300 sm:right-8 sm:bottom-8",
      hasBottomNav ? "bottom-20" : "bottom-6"
    )}>
      {/* Webcall FAB */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white transition-transform hover:scale-110 active:scale-95"
            title="Panggil Asisten Lestari"
          >
            <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] sm:max-w-sm p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl">
          <DialogHeader className="p-4 border-b bg-muted/30">
            <DialogTitle className="text-center font-black uppercase tracking-widest text-primary text-sm">Asisten Suara Lestari</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-[9/16] bg-black">
            <iframe
              src={webcallUrl}
              className="w-full h-full border-none"
              allow="microphone"
              title="Asisten Lestari Webcall"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp FAB */}
      <Button
        asChild
        size="icon"
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#20ba56] text-white transition-transform hover:scale-110 active:scale-95"
        title="WhatsApp Asisten Lestari"
      >
        <Link href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
        </Link>
      </Button>
    </div>
  );
}
