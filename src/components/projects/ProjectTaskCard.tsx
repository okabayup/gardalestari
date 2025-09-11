
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectTask } from '@/app/actions/projects';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface ProjectTaskCardProps {
  task: ProjectTask;
}

export default function ProjectTaskCard({ task }: ProjectTaskCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        onClick={() => setIsDetailOpen(true)}
      >
        <Card className="hover:bg-muted/80 cursor-pointer active:cursor-grabbing">
          <CardContent className="p-3 text-sm">
            {task.title}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{task.title}</DialogTitle>
                <DialogDescription>
                   {task.description || "Tidak ada deskripsi."}
                </DialogDescription>
            </DialogHeader>
            {/* Further details like assignee, due date, etc. will go here */}
        </DialogContent>
      </Dialog>
    </>
  );
}
