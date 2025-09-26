
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Thread } from '@/app/assistant/page';

interface HistoryListProps {
  threads: Thread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string) => void;
  handleDeleteThread: (id: string) => void;
}

const HistoryList = ({ threads, activeThreadId, setActiveThreadId, handleDeleteThread }: HistoryListProps) => {
  // Create a mutable copy for sorting
  const sortedThreads = [...threads].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
        {sortedThreads.map(thread => (
             <div key={thread.id} className="relative group">
                <button
                    onClick={() => setActiveThreadId(thread.id)}
                    className={cn(
                        'w-full text-left p-2 rounded-md text-sm truncate',
                        activeThreadId === thread.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'
                    )}
                >
                    {thread.title}
                </button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteThread(thread.id)}
                >
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
        ))}
        </div>
    </ScrollArea>
  );
};

export default HistoryList;
