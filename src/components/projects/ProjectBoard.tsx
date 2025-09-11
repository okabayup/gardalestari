
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { produce } from 'immer';
import { ProjectColumn, ProjectTask, updateTaskColumn, updateTeamMembers } from '@/app/actions/projects';
import { getMembers, type MemberWithStatus } from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';
import ProjectColumnComponent from './ProjectColumn';
import ProjectTaskCard from './ProjectTaskCard';
import { Button } from '../ui/button';
import { UserPlus } from 'lucide-react';
import { ManageTeamDialog } from './ManageTeamDialog';

interface ProjectBoardProps {
  initialColumns: ProjectColumn[];
  initialTasks: ProjectTask[];
  projectId: string;
  onCreateTask: (columnId: string, title: string) => Promise<void>;
  onDataRefresh: () => void;
  projectTeamIds: string[];
}

export default function ProjectBoard({ initialColumns, initialTasks, projectId, onCreateTask, onDataRefresh, projectTeamIds }: ProjectBoardProps) {
  const { toast } = useToast();
  const [columns, setColumns] = useState<ProjectColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
  const [teamIds, setTeamIds] = useState(projectTeamIds);

  useEffect(() => {
    getMembers().then(setAllMembers);
  }, []);

  useEffect(() => {
    setColumns(initialColumns);
    setTasks(initialTasks);
    setTeamIds(projectTeamIds);
  }, [initialColumns, initialTasks, projectTeamIds]);


  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  }));
  
  const tasksById = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {} as Record<string, ProjectTask>);
  }, [tasks]);

  const findColumnForTask = (taskId: string) => {
    return columns.find(col => col.taskIds.includes(taskId));
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasksById[active.id as string];
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const isActiveTask = active.data.current?.type === 'Task';
    if (!isActiveTask) return;
    
    const isOverColumn = over.data.current?.type === 'Column';

    // Optimistically update UI
    setColumns(currentColumns => {
        return produce(currentColumns, draft => {
            const activeColumn = draft.find(c => c.taskIds.includes(active.id as string));
            if (!activeColumn) return;

            let overColumnId: string;
            let overIndex: number;
            
            if (isOverColumn) {
                overColumnId = over.id as string;
                const overColumn = draft.find(c => c.id === overColumnId);
                overIndex = overColumn?.taskIds.length || 0;
            } else { // isOverTask
                const overTaskColumn = draft.find(c => c.taskIds.includes(over.id as string));
                if (!overTaskColumn) return;
                overColumnId = overTaskColumn.id;
                overIndex = overTaskColumn.taskIds.indexOf(over.id as string);
            }
            
            if (activeColumn.id !== overColumnId) {
                activeColumn.taskIds = activeColumn.taskIds.filter(id => id !== active.id);
                const overColumn = draft.find(c => c.id === overColumnId);
                overColumn?.taskIds.splice(overIndex, 0, active.id as string);
            } else {
                 const oldIndex = activeColumn.taskIds.indexOf(active.id as string);
                 activeColumn.taskIds = arrayMove(activeColumn.taskIds, oldIndex, overIndex);
            }
        });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumn = findColumnForTask(active.id as string);
    if (!sourceColumn) return; // Should not happen
    
    const isOverColumn = over.data.current?.type === 'Column';
    const destColumnId = isOverColumn ? over.id as string : findColumnForTask(over.id as string)?.id;
    if (!destColumnId) return;

    const destColumn = columns.find(c => c.id === destColumnId);
    if(!destColumn) return;

    let newIndex: number;
    if (isOverColumn) {
      newIndex = destColumn.taskIds.length;
    } else {
      newIndex = destColumn.taskIds.indexOf(over.id as string);
    }
    
    if (newIndex === -1) newIndex = destColumn.taskIds.length;
    
    try {
        await updateTaskColumn(projectId, active.id as string, sourceColumn.id, destColumnId, newIndex);
    } catch (error) {
        toast({ variant: 'destructive', title: "Gagal memindahkan tugas", description: (error as Error).message });
    } finally {
        onDataRefresh(); // Re-fetch to ensure data consistency after drop
    }
  };

  const handleUpdateTeam = async (newTeamIds: string[]) => {
    try {
        await updateTeamMembers(projectId, newTeamIds);
        setTeamIds(newTeamIds);
        setIsTeamDialogOpen(false);
        toast({ title: 'Tim berhasil diperbarui.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memperbarui tim', description: (error as Error).message });
    }
  }


  return (
    <>
    <div className="absolute top-4 right-4 z-10">
        <Button onClick={() => setIsTeamDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Kelola Tim
        </Button>
    </div>
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      collisionDetection={closestCorners}
    >
      <div className="flex gap-4 items-start p-1 h-full">
        {columns.map(col => (
          <ProjectColumnComponent
            key={col.id}
            column={col}
            tasks={col.taskIds.map(id => tasksById[id]).filter(Boolean)}
            onCreateTask={onCreateTask}
            projectId={projectId}
            teamMembers={allMembers.filter(m => teamIds.includes(m.id))}
            onTaskUpdate={onDataRefresh}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <ProjectTaskCard task={activeTask} teamMembers={[]} projectId={''} onTaskUpdate={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
    <ManageTeamDialog
        isOpen={isTeamDialogOpen}
        onClose={() => setIsTeamDialogOpen(false)}
        allMembers={allMembers}
        currentTeamIds={teamIds}
        onSave={handleUpdateTeam}
     />
    </>
  );
}
