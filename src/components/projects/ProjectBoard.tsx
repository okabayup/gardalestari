
'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { produce } from 'immer';
import { ProjectColumn, ProjectTask, updateTaskColumn } from '@/app/actions/projects';
import { useToast } from '@/hooks/use-toast';
import ProjectColumnComponent from './ProjectColumn';
import ProjectTaskCard from './ProjectTaskCard';

interface ProjectBoardProps {
  initialColumns: ProjectColumn[];
  initialTasks: ProjectTask[];
  projectId: string;
  onCreateTask: (columnId: string, title: string) => Promise<void>;
  onDataRefresh: () => void;
}

export default function ProjectBoard({ initialColumns, initialTasks, projectId, onCreateTask, onDataRefresh }: ProjectBoardProps) {
  const { toast } = useToast();
  const [columns, setColumns] = useState<ProjectColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

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
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setColumns(currentColumns => {
        return produce(currentColumns, draft => {
            const activeColumn = draft.find(c => c.taskIds.includes(active.id as string));
            
            if (isOverTask) {
                const overColumn = draft.find(c => c.taskIds.includes(over.id as string));
                if (activeColumn && overColumn && activeColumn.id !== overColumn.id) {
                    activeColumn.taskIds = activeColumn.taskIds.filter(id => id !== active.id);
                    const overIndex = overColumn.taskIds.indexOf(over.id as string);
                    overColumn.taskIds.splice(overIndex, 0, active.id as string);
                }
            } else if (isOverColumn) {
                const overColumn = draft.find(c => c.id === over.id);
                if (activeColumn && overColumn && activeColumn.id !== overColumn.id) {
                     activeColumn.taskIds = activeColumn.taskIds.filter(id => id !== active.id);
                     overColumn.taskIds.push(active.id as string);
                }
            }
        });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const sourceColumn = findColumnForTask(active.id as string);
    let destColumn = columns.find(col => col.taskIds.includes(over.id as string));
     if (!destColumn) {
        destColumn = columns.find(col => col.id === over.id);
    }

    if (!sourceColumn || !destColumn) return;

    const oldIndex = sourceColumn.taskIds.indexOf(active.id as string);
    let newIndex = destColumn.taskIds.indexOf(over.id as string);
    
    if (newIndex === -1 && over.data.current?.type === 'Column') {
      newIndex = destColumn.taskIds.length;
    }
    
    if (oldIndex !== newIndex || sourceColumn.id !== destColumn.id) {
      try {
        await updateTaskColumn(projectId, active.id as string, sourceColumn.id, destColumn.id, newIndex);
        // We're relying on the optimistic update. To be fully robust, one might re-fetch data here.
        onDataRefresh();
      } catch (error) {
        toast({ variant: 'destructive', title: "Gagal memindahkan tugas", description: (error as Error).message });
        // Revert UI changes on error
        setColumns(initialColumns);
      }
    }
  };


  return (
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
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <ProjectTaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
