

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectTask } from '@/app/actions/projects';
import { useState } from 'react';
import TaskDetailDialog from './TaskDetailDialog';
import type { MemberWithStatus } from '@/app/actions/members';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Calendar, MessageSquare, CheckSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';


interface ProjectTaskCardProps {
  task: ProjectTask;
  teamMembers: MemberWithStatus[];
  projectId: string;
  onTaskUpdate: () => void;
}

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

export default function ProjectTaskCard({ task, teamMembers, projectId, onTaskUpdate }: ProjectTaskCardProps) {
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
  
  const getAssignee = (id: string) => teamMembers.find(m => m.id === id);
  
  const checklistProgress = useMemo(() => {
    if (!task.checklist || task.checklist.length === 0) return null;
    const completed = task.checklist.filter(item => item.completed).length;
    const total = task.checklist.length;
    return {
      percentage: (completed / total) * 100,
      text: `${completed}/${total}`,
    };
  }, [task.checklist]);

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
          <CardContent className="p-3 text-sm space-y-2">
            <p>{task.title}</p>
            <div className="flex flex-wrap gap-1">
                {task.labels?.map(label => (
                    <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                ))}
            </div>
            {checklistProgress && (
              <div className="flex items-center gap-2">
                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                <Progress value={checklistProgress.percentage} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{checklistProgress.text}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.dueDate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'dd MMM')}
                        </div>
                    )}
                     {task.commentCount > 0 && (
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {task.commentCount}
                        </div>
                    )}
                </div>
                <div className="flex -space-x-2">
                    {task.assigneeIds?.map(id => {
                        const member = getAssignee(id);
                        return member ? (
                            <Avatar key={id} className="h-5 w-5 border-2 border-background">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                        ) : null
                    })}
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <TaskDetailDialog 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        task={task}
        teamMembers={teamMembers}
        projectId={projectId}
        onUpdate={onTaskUpdate}
      />
    </>
  );
}
