'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';
import { PanelSidebarContent } from './Sidebar';
import { usePanelBadges } from '@/hooks/use-panel-badges';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function PanelBottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { badges } = usePanelBadges();

  const totalBadges = badges.pendingMembers;

  return (
    <div className="md:hidden fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bottom-0 top-auto h-[80vh] bg-background/80 backdrop-blur-lg rounded-t-2xl shadow-lg border-t"
          >
            <div className="flex h-full flex-col">
                <PanelSidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       <Button
        size="icon"
        className={cn(
          "rounded-full h-14 w-14 shadow-2xl relative transition-transform duration-300",
          isOpen ? "bg-destructive hover:bg-destructive/90 scale-110" : "bg-primary hover:bg-primary/90"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence initial={false}>
            {isOpen ? (
                 <motion.div key="close" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }}>
                    <X className="h-6 w-6" />
                 </motion.div>
            ) : (
                <motion.div key="open" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }}>
                    <Menu className="h-6 w-6" />
                 </motion.div>
            )}
        </AnimatePresence>
        
        {!isOpen && totalBadges > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-destructive justify-center items-center text-xs text-white">
              {totalBadges}
            </span>
          </span>
        )}
      </Button>
    </div>
  );
}
