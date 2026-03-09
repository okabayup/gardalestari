
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function FloatingContactButtons() {
  const pathname = usePathname();
  const whatsappNumber = '6285144904161';
  const webcallUrl = 'https://asisten-lestari-webcall-625063745466.asia-southeast1.run.app';

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
      "fixed right-4 z-50 flex flex-col gap-3 transition-all duration-300 sm:right-8",
      hasBottomNav ? "bottom-[72px]" : "bottom-6"
    )}>
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
        <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-black shadow-none flex flex-col overflow-hidden rounded-none m-0 [&>button]:text-white [&>button]:h-10 [&>button]:w-10 [&>button]:bg-white/10 [&>button]:backdrop-blur-md [&>button]:rounded-full [&>button]:top-6 [&>button]:right-6">
          <div className="flex-1 w-full h-full relative bg-black">
            <iframe
              src={webcallUrl}
              className="absolute inset-0 w-full h-full border-none"
              allow="microphone"
              title="Asisten Lestari Webcall"
            />
          </div>
        </DialogContent>
      </Dialog>

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
