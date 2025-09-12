
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Search, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getIdeas, getIdeaCategories, IdeaWithAuthor, toggleVote } from '@/app/actions/ideas';
import { ideaStatusMap } from '@/lib/definitions';
import { useDebounce } from 'use-debounce';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/members/VerifiedBadge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const IdeaCard = ({ idea, onVote }: { idea: IdeaWithAuthor, onVote: (ideaId: string, vote: 'up' | 'down') => void }) => {
  const currentStatus = ideaStatusMap[idea.status];
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <Link href={`/ideas/${idea.id}`} className="pr-4">
                <CardTitle className="leading-tight hover:text-primary">
                    {idea.title}
                </CardTitle>
            </Link>
            <Badge className={cn("whitespace-nowrap", currentStatus.color)}>{currentStatus.label}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2 pt-1 text-xs">
            <Avatar className="h-5 w-5">
              <AvatarImage src={idea.author.avatarUrl} alt={idea.author.name} />
              <AvatarFallback>{idea.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{idea.author.username}</span>
            <VerifiedBadge type={idea.author.type} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button variant={idea.userVote === 'up' ? 'default' : 'outline'} size="sm" onClick={() => onVote(idea.id, 'up')} className="gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{idea.voteScore}</span>
            </Button>
            <Button variant={idea.userVote === 'down' ? 'destructive' : 'outline'} size="sm" onClick={() => onVote(idea.id, 'down')}>
                <ThumbsDown className="h-4 w-4" />
            </Button>
        </div>
         <Link href={`/ideas/${idea.id}`} className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {idea.commentCount}
        </Link>
      </CardFooter>
    </Card>
  );
};


export default function IdeasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [ideas, setIdeas] = useState<IdeaWithAuthor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search state
  const [sortBy, setSortBy] = useState<'newest' | 'top'>(searchParams.get('sort') as any || 'newest');
  const [category, setCategory] = useState(searchParams.get('category') || 'Semua');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const fetchedCategories = await getIdeaCategories();
            setCategories(fetchedCategories);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal memuat kategori' });
        }
    };
    fetchInitialData();
  }, [toast]);
  
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchIdeas = async () => {
      try {
        const fetchedIdeas = await getIdeas(user.uid, sortBy, category, debouncedSearchTerm);
        setIdeas(fetchedIdeas);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat ide' });
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
    
    // Update URL params
    const params = new URLSearchParams();
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (category !== 'Semua') params.set('category', category);
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    router.replace(`${pathname}?${params.toString()}`);

  }, [user, sortBy, category, debouncedSearchTerm, router, pathname, toast]);

  const handleVote = async (ideaId: string, voteType: 'up' | 'down') => {
    if (!user) return;
    
    // Optimistic update
    setIdeas(prevIdeas => prevIdeas.map(idea => {
        if (idea.id === ideaId) {
            const currentVote = idea.userVote;
            let newVoteScore = idea.voteScore;
            
            if (currentVote === voteType) { // Un-voting
                newVoteScore += (voteType === 'up' ? -1 : 1);
                return { ...idea, userVote: undefined, voteScore: newVoteScore };
            } else { // Voting or changing vote
                if (currentVote) newVoteScore += (voteType === 'up' ? 2 : -2); // e.g. from down to up
                else newVoteScore += (voteType === 'up' ? 1 : -1);
                return { ...idea, userVote: voteType, voteScore: newVoteScore };
            }
        }
        return idea;
    }));

    try {
        await toggleVote(ideaId, user.uid, voteType);
    } catch (error) {
        toast({ variant: "destructive", title: "Gagal memberikan suara", description: (error as Error).message });
        // Revert on error - re-fetching would be more robust
        const fetchedIdeas = await getIdeas(user.uid, sortBy, category, debouncedSearchTerm);
        setIdeas(fetchedIdeas);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
                <h1 className="font-headline text-3xl font-bold">Bank Ide</h1>
                <p className="text-muted-foreground">Ajukan, diskusikan, dan dukung ide untuk Garda Lestari.</p>
            </div>
            <Button onClick={() => router.push('/ideas/new')} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajukan Ide Baru
            </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari ide..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="top">Paling Populer</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        {/* Idea List */}
        {loading ? (
             <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.length > 0 ? (
                ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
                ))
            ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                    <p>Tidak ada ide yang ditemukan. Jadilah yang pertama!</p>
                </div>
            )}
            </div>
        )}
      </div>
    </MainLayout>
  );
}
