
'use client';

import { useSortable, SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProjectColumn, ProjectTask } from '@/app/actions/projects';
import ProjectTaskCard from './ProjectTaskCard';

interface ProjectColumnProps {
  column: ProjectColumn;
  tasks: ProjectTask[];
}

export default function ProjectColumnComponent({ column, tasks }: ProjectColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column' },
  });

  return (
    <Card ref={setNodeRef} className="w-72 flex-shrink-0">
      <CardHeader className="p-4">
        <CardTitle className="text-base">{column.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-2 min-h-[5rem]">
        <SortableContext items={tasks.map(t => t.id)}>
          {tasks.map(task => (
            <ProjectTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  );
}
