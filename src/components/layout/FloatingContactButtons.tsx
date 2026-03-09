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

export default function FloatingContactButtons() {
  const whatsappNumber = '6285144904161';
  const webcallUrl = 'https://asisten-lestari-webcall-625063745466.asia-southeast1.run.app';

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3 sm:bottom-8 sm:right-8">
      {/* Webcall FAB */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white transition-transform hover:scale-110 active:scale-95"
            title="Panggil Asisten Lestari"
          >
            <Phone className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl">
          <DialogHeader className="p-4 border-b bg-muted/30">
            <DialogTitle className="text-center font-black uppercase tracking-widest text-primary text-sm">Asisten Suara Lestari</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-black">
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
        className="h-14 w-14 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#20ba56] text-white transition-transform hover:scale-110 active:scale-95"
        title="WhatsApp Asisten Lestari"
      >
        <Link href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-7 w-7" />
        </Link>
      </Button>
    </div>
  );
}
