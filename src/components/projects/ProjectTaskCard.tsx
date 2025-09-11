
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectTask } from '@/app/actions/projects';

interface ProjectTaskCardProps {
  task: ProjectTask;
}

export default function ProjectTaskCard({ task }: ProjectTaskCardProps) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="hover:bg-muted/80 cursor-grab active:cursor-grabbing">
        <CardContent className="p-3 text-sm">
          {task.title}
        </CardContent>
      </Card>
    </div>
  );
}
