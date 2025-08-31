
'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, MoreHorizontal, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostWithAuthor, CommentWithAuthor } from '@/app/actions/posts';
import { MemberLevelBadge } from '../members/MemberLevelBadge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '../ui/input';
import { useState } from 'react';
import { addComment, getComments } from '@/app/actions/posts';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import CommentList from './CommentList';


interface PostCardProps {
  post: PostWithAuthor;
  onToggleLike: () => void;
  onArchive: () => void;
  currentUserId?: string;
}

const CaptionWithMentions = ({ text }: { text: string }) => {
  const words = text.split(/(\s+)/); // Split by space, keeping the spaces

  return (
    <>
      {words.map((word, index) => {
        if (word.startsWith('@')) {
          const username = word.substring(1);
          return (
            <Link key={index} href={`/profile/${username}`} className="font-semibold text-primary hover:underline">
              {word}
            </Link>
          );
        }
        return word;
      })}
    </>
  );
};


export default function PostCard({ post, onToggleLike, onArchive, currentUserId }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      await addComment(post.id, user.uid, commentText);
      setCommentText('');
      toast({ title: 'Komentar ditambahkan!' });
      // Optionally, refresh comments after adding
      if (isCommentsOpen) {
          handleFetchComments();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal berkomentar',
        description: (error as Error).message
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleFetchComments = async () => {
      if (!isCommentsOpen) { // Fetch only when opening
          try {
              const fetchedComments = await getComments(post.id);
              setComments(fetchedComments);
          } catch (error) {
              toast({ variant: 'destructive', title: 'Gagal memuat komentar' });
          }
      }
  }
  
  const isAuthor = currentUserId === post.author.username; // This logic might need adjustment based on what's in author object

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 p-3">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <div className="flex items-center gap-2">
                <Link href={`/profile/${post.author.username}`} className="font-semibold hover:underline">{post.author.name}</Link>
                <span className="text-sm text-muted-foreground">@{post.author.username}</span>
            </div>
            <MemberLevelBadge level={post.author.level} />
            
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {isAuthor && (
                    <DropdownMenuItem onClick={onArchive}>
                        <Archive className="mr-2 h-4 w-4" />
                        Arsipkan
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem>Laporkan</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <Carousel className="w-full bg-black">
            <CarouselContent>
            {post.media.map((mediaItem, index) => (
                <CarouselItem key={index}>
                    <div className="relative w-full flex items-center justify-center">
                        {mediaItem.type === 'image' ? (
                            <Image
                                src={mediaItem.url}
                                alt={`Post by ${post.author.name} - ${index + 1}`}
                                data-ai-hint={mediaItem.hint}
                                width={1080}
                                height={1080}
                                className="object-contain w-full h-auto"
                            />
                        ) : (
                            <video
                                src={mediaItem.url}
                                controls
                                muted
                                loop
                                className="w-full h-auto object-contain"
                            />
                        )}
                    </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            {post.media.length > 1 && (
                <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                </>
            )}
        </Carousel>
        <div className="p-3">
            <p className="text-sm">
                <Link href={`/profile/${post.author.username}`} className="font-semibold hover:underline">{post.author.name}</Link>{' '}
                <CaptionWithMentions text={post.caption} />
            </p>
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-start gap-2 p-3 pt-0">
        <div className="flex w-full items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onToggleLike}>
                <Heart className={cn("h-5 w-5", post.isLiked && "fill-red-500 text-red-500")} />
            </Button>
             <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleFetchComments}>
                        <MessageCircle className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col">
                    <SheetHeader className="text-center">
                        <SheetTitle>Komentar</SheetTitle>
                    </SheetHeader>
                    <CommentList comments={comments} />
                </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon">
                <Send className="h-5 w-5" />
            </Button>
        </div>
        <div className="px-1 text-sm font-semibold">{post.likesCount.toLocaleString()} likes</div>
        {post.commentsCount > 0 && (
           <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <SheetTrigger asChild>
                <button onClick={handleFetchComments} className="px-1 text-sm text-muted-foreground">
                    Lihat semua {post.commentsCount} komentar
                </button>
            </SheetTrigger>
             <SheetContent side="bottom" className="h-[80vh] flex flex-col">
                <SheetHeader className="text-center">
                    <SheetTitle>Komentar</SheetTitle>
                </SheetHeader>
                <CommentList comments={comments} />
            </SheetContent>
            </Sheet>
        )}
         <div className="px-1 text-xs text-muted-foreground">{post.timestamp}</div>
        <form onSubmit={handleCommentSubmit} className="flex w-full items-center gap-2">
            <Avatar className="h-6 w-6">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Input 
                className="h-8 rounded-full" 
                placeholder="Tambahkan komentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isCommenting}
            />
            <Button type="submit" variant="ghost" size="sm" disabled={isCommenting || !commentText.trim()}>
                Kirim
            </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
