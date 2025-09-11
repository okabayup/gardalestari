
'use client';

import { useState } from 'react';
import { useSortable, SortableContext } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProjectColumn, ProjectTask } from '@/app/actions/projects';
import type { MemberWithStatus } from '@/app/actions/members';
import ProjectTaskCard from './ProjectTaskCard';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';

interface ProjectColumnProps {
  column: ProjectColumn;
  tasks: ProjectTask[];
  onCreateTask: (columnId: string, title: string) => Promise<void>;
  projectId: string;
  teamMembers: MemberWithStatus[];
  onTaskUpdate: () => void;
}

export default function ProjectColumnComponent({ column, tasks, onCreateTask, projectId, teamMembers, onTaskUpdate }: ProjectColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column' },
  });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsSaving(true);
    await onCreateTask(column.id, newTaskTitle.trim());
    setNewTaskTitle('');
    setIsAdding(false);
    setIsSaving(false);
  };


  return (
    <Card ref={setNodeRef} className="w-72 flex-shrink-0 bg-muted/50 h-full flex flex-col">
      <CardHeader className="p-4 flex-row justify-between items-center">
        <CardTitle className="text-base">{column.title}</CardTitle>
        <span className="text-sm font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">{tasks.length}</span>
      </CardHeader>
      <CardContent className="p-2 space-y-2 flex-1 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)}>
          {tasks.map(task => (
            <ProjectTaskCard 
                key={task.id} 
                task={task} 
                teamMembers={teamMembers}
                projectId={projectId}
                onTaskUpdate={onTaskUpdate}
            />
          ))}
        </SortableContext>
         {isAdding && (
            <div className="space-y-2">
                <Textarea 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Masukkan judul tugas..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                />
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddTask} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Simpan
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                        <X className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
      <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tugas
          </Button>
      </div>
    </Card>
  );
}
