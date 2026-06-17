'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, MoreHorizontal, Archive, Tag, Undo, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostWithAuthor, CommentWithAuthor } from '@/app/actions/posts';
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
import { VerifiedBadge } from '../members/VerifiedBadge';
import { logAnalyticsEvent } from '@/lib/analytics';
import { ReportDialog } from '@/components/ReportDialog';


interface PostCardProps {
  post: PostWithAuthor;
  onToggleLike: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  currentUserId?: string;
  isDetailPage?: boolean;
}

const CaptionWithMentions = ({ text }: { text: string }) => {
  const words = text.split(/(\s+)/); // Split by space, keeping the spaces

  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
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
    </p>
  );
};

const TaggedUsersOverlay = ({ media }: { media: PostWithAuthor['media'] }) => {
  const allMentions = media.flatMap(m => m.mentions || []);
  if (allMentions.length === 0) return null;

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div className="flex flex-wrap gap-2 p-4">
        {allMentions.map(mention => (
          <Link
            key={mention.userId}
            href={`/profile/${mention.username}`}
            className="bg-black/70 text-white text-xs rounded-md px-2 py-1 hover:bg-black"
          >
            @{mention.username}
          </Link>
        ))}
      </div>
    </div>
  );
};


export default function PostCard({ post, onToggleLike, onArchive, onUnarchive, currentUserId, isDetailPage = false }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      await addComment(post.id, user.uid, commentText);
      setCommentText('');
      toast({ title: 'Komentar ditambahkan!' });
      logAnalyticsEvent('add_comment', { post_id: post.id });
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
      if (!isCommentsOpen) { 
          try {
              const fetchedComments = await getComments(post.id);
              setComments(fetchedComments);
          } catch (error) {
              toast({ variant: 'destructive', title: 'Gagal memuat komentar' });
          }
      }
  }

  const handleShare = async () => {
    const shareData = {
      title: `Postingan oleh ${post.author.username}`,
      text: post.caption.substring(0, 100) + '...',
      url: `${window.location.origin}/p/${post.id}`,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        logAnalyticsEvent('share', { content_type: 'post', item_id: post.id });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: 'Tautan disalin!',
        description: 'Tautan ke postingan ini telah disalin ke clipboard Anda.',
      });
    }
  };
  
  const isAuthor = currentUserId === post.author.id;
  const isArchived = post.status === 'archived';
  const hasTags = post.media.some(m => m.mentions && m.mentions.length > 0);

  return (
    <>
    <Card className={cn("overflow-hidden rounded-[2rem] border-none shadow-xl shadow-black/5", isArchived && "bg-muted/50")}>
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Link href={`/profile/${post.author.username}`}>
            <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
        </Link>
        <div className="flex-grow flex items-center gap-1">
            <Link href={`/profile/${post.author.username}`} className="font-bold hover:text-primary transition-colors">
                {post.author.username}
            </Link>
            <VerifiedBadge type={post.author.type} />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
                {isAuthor && !isArchived && (
                    <DropdownMenuItem onClick={onArchive}>
                        <Archive className="mr-2 h-4 w-4" />
                        Arsipkan
                    </DropdownMenuItem>
                )}
                 {isAuthor && isArchived && (
                    <DropdownMenuItem onClick={onUnarchive}>
                        <Undo className="mr-2 h-4 w-4" />
                        Pulihkan
                    </DropdownMenuItem>
                )}
                {!isAuthor && <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="text-destructive focus:text-destructive"><Flag className="mr-2 h-4 w-4" />Laporkan</DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0 relative">
        <Carousel className="w-full bg-black">
            <CarouselContent>
            {post.media.map((mediaItem, index) => (
                <CarouselItem key={index}>
                    <div className="w-full flex items-center justify-center bg-[#050505]">
                        {mediaItem.type === 'image' ? (
                            <Image
                                src={mediaItem.url}
                                alt={`Post by ${post.author.name} - ${index + 1}`}
                                data-ai-hint={mediaItem.hint}
                                width={1080}
                                height={1080}
                                className="object-contain w-full h-auto max-h-[70vh]"
                            />
                        ) : (
                            <video
                                src={mediaItem.url}
                                controls
                                muted
                                loop
                                className="w-full h-auto max-h-[70vh] object-contain"
                            />
                        )}
                        <TaggedUsersOverlay media={post.media} />
                    </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            {post.media.length > 1 && (
                <>
                    <CarouselPrevious className="left-2 bg-white/20 hover:bg-white/40 border-none text-white" />
                    <CarouselNext className="right-2 bg-white/20 hover:bg-white/40 border-none text-white" />
                </>
            )}
        </Carousel>
        {hasTags && <Tag className="absolute bottom-4 left-4 h-5 w-5 text-white drop-shadow-md" />}
        <div className="p-4">
             <CaptionWithMentions text={post.caption} />
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-start gap-3 p-4 pt-0">
        <div className="flex w-full items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { onToggleLike(); logAnalyticsEvent('like_post', { post_id: post.id }); }} disabled={isArchived} className="rounded-full hover:bg-red-50 hover:text-red-500">
                <Heart className={cn("h-6 w-6 transition-all", post.isLiked && "fill-red-500 text-red-500 scale-110")} />
            </Button>
             <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleFetchComments} disabled={isArchived} className="rounded-full hover:bg-primary/5 hover:text-primary">
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] flex flex-col border-none shadow-2xl">
                    <SheetHeader className="text-center pt-2">
                        <SheetTitle className="text-xl font-black">Diskusi</SheetTitle>
                    </SheetHeader>
                    <CommentList comments={comments} />
                </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={isArchived} className="rounded-full hover:bg-primary/5 hover:text-primary">
                <Send className="h-6 w-6" />
            </Button>
        </div>
        <div className="px-1 text-sm font-black">{post.likesCount.toLocaleString()} suka</div>
        {post.commentsCount > 0 && !isDetailPage && (
           <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <SheetTrigger asChild>
                <button onClick={handleFetchComments} className="px-1 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors" disabled={isArchived}>
                    Lihat {post.commentsCount} komentar
                </button>
            </SheetTrigger>
             <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] flex flex-col border-none shadow-2xl">
                <SheetHeader className="text-center pt-2">
                    <SheetTitle className="text-xl font-black">Diskusi</SheetTitle>
                </SheetHeader>
                <CommentList comments={comments} />
            </SheetContent>
            </Sheet>
        )}
         <div className="px-1 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{post.timestamp}</div>
         {!isArchived &&
            <form onSubmit={handleCommentSubmit} className="flex w-full items-center gap-3 mt-2 bg-muted/30 p-1.5 rounded-full pl-3">
                <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary text-white text-[10px]">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <Input 
                    className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm p-0 placeholder:text-muted-foreground/60" 
                    placeholder="Tulis pesan kamu..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isCommenting}
                />
                <Button type="submit" variant="ghost" size="sm" disabled={isCommenting || !commentText.trim()} className="rounded-full font-bold text-primary hover:bg-primary/10">
                    Kirim
                </Button>
            </form>
         }
      </CardFooter>
    </Card>
     <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedItemId={post.id}
        reportedItemType="post"
        reportedItemContent={post.caption.substring(0, 30) + '...'}
      />
    </>
  );
};