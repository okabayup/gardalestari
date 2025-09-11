
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getProjects, Project } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, KanbanSquare } from 'lucide-react';
import Link from 'next/link';

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground">
          {project.taskCount} tugas | {project.teamIds.length} anggota
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/panel/projects/${project.id}`}>Buka Papan Kanban</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat proyek' });
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Proyek</h1>
          <p className="text-muted-foreground">Kelola semua proyek dan tugas tim Anda di sini.</p>
        </div>
        <Button onClick={() => router.push('/panel/projects/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Proyek Baru
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center">
          <KanbanSquare className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Belum ada proyek</h3>
          <p className="mt-2 text-sm text-muted-foreground">Mulai dengan membuat proyek pertama Anda.</p>
        </div>
      )}
    </div>
  );
}
