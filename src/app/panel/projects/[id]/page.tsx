
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getColumnsForProject, getTasksForProject, createTask } from '@/app/actions/projects';
import type { Project, ProjectColumn, ProjectTask } from '@/lib/definitions';
import { Loader2, ArrowLeft, Scroll } from 'lucide-react';
import ProjectBoard from '@/components/projects/ProjectBoard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectAnalytics from '@/components/projects/ProjectAnalytics';
import { getMembers, MemberWithStatus } from '@/app/actions/members';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = useCallback(async () => {
        setLoading(true);
        try {
          const [projectData, columnsData, tasksData, membersData] = await Promise.all([
            getProjectById(projectId),
            getColumnsForProject(projectId),
            getTasksForProject(projectId),
            getMembers()
          ]);

          if (!projectData) {
            toast({ variant: 'destructive', title: 'Proyek tidak ditemukan' });
            router.push('/panel/projects');
            return;
          }
          
          setProject(projectData);
          setColumns(columnsData);
          setTasks(tasksData);
          setMembers(membersData);
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
  
  const teamMembers = members.filter(m => project.teamIds.includes(m.id));

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
       <Tabs defaultValue="board" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="board">Papan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="w-full h-full whitespace-nowrap">
                <ProjectBoard
                    initialColumns={columns}
                    initialTasks={tasks}
                    projectId={projectId}
                    onCreateTask={handleCreateTask}
                    onDataRefresh={fetchProjectData}
                    projectTeamIds={project.teamIds}
                />
            </ScrollArea>
        </TabsContent>
        <TabsContent value="analytics" className="flex-1 overflow-y-auto mt-4">
             <ProjectAnalytics columns={columns} tasks={tasks} members={teamMembers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
