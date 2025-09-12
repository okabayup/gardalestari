
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getIdeas, updateIdeaStatus, IdeaWithAuthor } from '@/app/actions/ideas';
import { ideaStatusMap, IdeaStatus } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tags } from 'lucide-react';

export default function AdminIdeasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [ideas, setIdeas] = useState<IdeaWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchIdeas = async () => {
      try {
        const fetchedIdeas = await getIdeas(user.uid, 'newest');
        setIdeas(fetchedIdeas);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat ide' });
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [user, toast]);

  const handleStatusChange = async (ideaId: string, status: IdeaStatus) => {
    try {
      await updateIdeaStatus(ideaId, status);
      setIdeas(prev => prev.map(idea => idea.id === ideaId ? { ...idea, status } : idea));
      toast({ title: 'Status ide diperbarui!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui status', description: (error as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Bank Ide</h1>
          <p className="text-muted-foreground">Tinjau dan kelola semua ide yang diajukan oleh anggota.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/panel/ideas/kategori')}>
          <Tags className="mr-2 h-4 w-4" />
          Kelola Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Ide</CardTitle>
          <CardDescription>Total {ideas.length} ide ditemukan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Diajukan oleh</TableHead>
                <TableHead>Suara</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></TableCell></TableRow>
              ) : ideas.length > 0 ? (
                ideas.map(idea => (
                  <TableRow key={idea.id}>
                    <TableCell className="font-medium max-w-xs truncate">{idea.title}</TableCell>
                    <TableCell>{idea.author.username}</TableCell>
                    <TableCell>{idea.voteScore}</TableCell>
                    <TableCell>
                      <Badge className={cn(ideaStatusMap[idea.status].color)}>
                        {ideaStatusMap[idea.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/ideas/${idea.id}`)}>Lihat Detail</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(idea.id, 'ditinjau')}>Tandai Ditinjau</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(idea.id, 'disetujui')}>Tandai Disetujui</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(idea.id, 'diterapkan')}>Tandai Diterapkan</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(idea.id, 'ditolak')} className="text-destructive">Tandai Ditolak</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-10">Belum ada ide yang diajukan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
