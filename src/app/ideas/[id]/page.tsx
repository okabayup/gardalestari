
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Send, MoreHorizontal, Check, CircleDotDashed, FolderKanban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getIdeaById, getIdeaComments, addIdeaComment, toggleVote, updateIdeaStatus, IdeaWithAuthor, IdeaStatus, ideaStatusMap } from '@/app/actions/ideas';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const CommentList = ({ comments }: { comments: any[] }) => {
    if (comments.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar.</p>
    }
    return (
        <div className="space-y-4">
            {comments.map(comment => (
                 <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-sm bg-muted/50 p-3 rounded-lg">
                        <p>
                            <Link href={`/profile/${comment.author.username}`} className="font-semibold hover:underline">
                                {comment.author.username}
                            </Link>{' '}
                            {comment.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {comment.timestamp}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}


export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ideaId = params.id as string;
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  
  const [idea, setIdea] = useState<IdeaWithAuthor | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  
  const canManageIdeas = hasPermission('manage_ideas');
  const canManageProjects = hasPermission('manage_projects');

  useEffect(() => {
    if (ideaId) {
        const fetchIdea = async () => {
            setLoading(true);
            try {
                const [ideaData, commentsData] = await Promise.all([
                    getIdeaById(ideaId, user?.uid),
                    getIdeaComments(ideaId)
                ]);

                if (!ideaData) {
                    toast({ variant: 'destructive', title: 'Ide tidak ditemukan' });
                    router.push('/ideas');
                    return;
                }
                setIdea(ideaData);
                setComments(commentsData);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Gagal memuat detail ide' });
            } finally {
                setLoading(false);
            }
        };
        fetchIdea();
    }
  }, [ideaId, user?.uid, router, toast]);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || !idea) return;
    setIsVoting(true);
    try {
        await toggleVote(idea.id, user.uid, voteType);
        const updatedIdea = await getIdeaById(idea.id, user.uid);
        setIdea(updatedIdea);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memberikan suara' });
    } finally {
        setIsVoting(false);
    }
  };

  const handleStatusChange = async (status: IdeaStatus) => {
    if (!idea) return;
    try {
      await updateIdeaStatus(idea.id, status);
      setIdea(prev => prev ? { ...prev, status } : null);
      toast({ title: 'Status ide diperbarui!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memperbarui status', description: (error as Error).message });
    }
  };

  const handleCreateProject = () => {
      if (!idea) return;
      const params = new URLSearchParams({
          ideaId: idea.id,
          title: idea.title,
          description: idea.description,
      });
      router.push(`/panel/projects/new?${params.toString()}`);
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || !idea) return;
    
    setIsCommenting(true);
    try {
      await addIdeaComment(idea.id, user.uid, commentText);
      setCommentText('');
      const updatedComments = await getIdeaComments(idea.id);
      setComments(updatedComments);
      setIdea(prev => prev ? {...prev, commentCount: prev.commentCount + 1} : null);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mengirim komentar' });
    } finally {
      setIsCommenting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!idea) {
    return null; // Should have been redirected
  }

  const currentStatus = ideaStatusMap[idea.status];
  const canCreateProjectFromIdea = canManageProjects && (idea.status === 'disetujui' || idea.status === 'diterapkan');

  return (
    <MainLayout>
        <div className="p-6 space-y-6">
             <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Button>

            {canCreateProjectFromIdea && (
                <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="flex-row items-center gap-4">
                        <div className="flex-shrink-0 bg-primary text-primary-foreground p-2 rounded-full">
                            <FolderKanban className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-base">Ide Disetujui!</CardTitle>
                            <CardDescription className="text-xs">Ubah ide ini menjadi proyek yang dapat ditindaklanjuti.</CardDescription>
                        </div>
                        <Button onClick={handleCreateProject}>Buat Proyek</Button>
                    </CardHeader>
                </Card>
            )}
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
                        {canManageIdeas && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusChange('ditinjau')}>Tandai sebagai Ditinjau</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange('disetujui')}>Tandai sebagai Disetujui</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange('diterapkan')}>Tandai sebagai Diterapkan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange('ditolak')} className="text-destructive">Tandai sebagai Ditolak</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <CardTitle className="font-headline text-3xl pt-2">{idea.title}</CardTitle>
                    <div className="flex items-center gap-2 pt-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={idea.author.avatarUrl} alt={idea.author.name} />
                            <AvatarFallback>{idea.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <p className="text-sm font-semibold flex items-center gap-1">{idea.author.name} <VerifiedBadge type={idea.author.type}/></p>
                             <p className="text-xs text-muted-foreground">@{idea.author.username}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{idea.description}</p>
                    <Separator className="my-6" />
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Button variant={idea.userVote === 'up' ? 'default' : 'outline'} size="lg" onClick={() => handleVote('up')} disabled={isVoting} className="gap-2">
                                <ThumbsUp className="h-5 w-5" />
                                <span>{idea.voteScore}</span>
                            </Button>
                            <Button variant={idea.userVote === 'down' ? 'destructive' : 'outline'} size="lg" onClick={() => handleVote('down')} disabled={isVoting}>
                                <ThumbsDown className="h-5 w-5" />
                            </Button>
                        </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <MessageSquare className="h-5 w-5" />
                            <span className="font-semibold">{idea.commentCount} Komentar</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Diskusi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <Input 
                            placeholder="Tulis komentar Anda..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={isCommenting}
                        />
                        <Button type="submit" disabled={isCommenting || !commentText.trim()}>
                            {isCommenting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        </Button>
                    </form>
                    <CommentList comments={comments} />
                </CardContent>
            </Card>

        </div>
    </MainLayout>
  )
}
