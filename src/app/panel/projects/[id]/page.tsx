
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getColumnsForProject, getTasksForProject, createTask } from '@/app/actions/projects';
import type { Project, ProjectColumn, ProjectTask } from '@/app/actions/projects';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProjectBoard from '@/components/projects/ProjectBoard';
import { Button } from '@/components/ui/button';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = useCallback(async () => {
        setLoading(true);
        try {
          const [projectData, columnsData, tasksData] = await Promise.all([
            getProjectById(projectId),
            getColumnsForProject(projectId),
            getTasksForProject(projectId)
          ]);

          if (!projectData) {
            toast({ variant: 'destructive', title: 'Proyek tidak ditemukan' });
            router.push('/panel/projects');
            return;
          }
          
          setProject(projectData);
          setColumns(columnsData);
          setTasks(tasksData);
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal memuat data proyek' });
        } finally {
          setLoading(false);
        }
      }, [projectId, router, toast]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  const handleCreateTask = async (columnId: string, title: string) => {
    try {
        const newTask = await createTask(projectId, columnId, title);
        setTasks(prev => [...prev, newTask]);
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, taskIds: [...c.taskIds, newTask.id] } : c));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal membuat tugas', description: (error as Error).message });
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!project) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push('/panel/projects')}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <div>
            <h1 className="font-headline text-2xl font-bold">{project.title}</h1>
            <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <ProjectBoard
            initialColumns={columns}
            initialTasks={tasks}
            projectId={projectId}
            onCreateTask={handleCreateTask}
            onDataRefresh={fetchProjectData}
        />
      </div>
    </div>
  );
}
