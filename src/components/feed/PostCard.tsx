
'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostWithAuthor } from '@/app/actions/posts';
import { MemberLevelBadge } from '../members/MemberLevelBadge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '../ui/input';
import { useState } from 'react';
import { addComment } from '@/app/actions/posts';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';


interface PostCardProps {
  post: PostWithAuthor;
  onToggleLike: () => void;
}

export default function PostCard({ post, onToggleLike }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      await addComment(post.id, user.uid, commentText);
      setCommentText('');
      toast({ title: 'Komentar ditambahkan!' });
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 p-3">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{post.author.name}</span>
                <MemberLevelBadge level={post.author.level} />
            </div>
            <span className="text-xs text-muted-foreground">{post.timestamp}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Carousel className="w-full">
            <CarouselContent>
            {post.media.map((mediaItem, index) => (
                <CarouselItem key={index}>
                    <div className="relative w-full bg-black">
                        {mediaItem.type === 'image' ? (
                            <Image
                                src={mediaItem.url}
                                alt={`Post by ${post.author.name} - ${index + 1}`}
                                data-ai-hint={mediaItem.hint}
                                layout="responsive"
                                width={1080}
                                height={1080}
                                objectFit="contain"
                                className="mx-auto"
                            />
                        ) : (
                            <video
                                src={mediaItem.url}
                                controls
                                className="w-full h-auto max-h-[80vh] object-contain"
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
                <span className="font-semibold">{post.author.name}</span>{' '}
                {post.caption}
            </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 p-3 pt-0">
        <div className="flex w-full items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onToggleLike}>
                <Heart className={cn("h-5 w-5", post.isLiked && "fill-red-500 text-red-500")} />
            </Button>
            <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <Send className="h-5 w-5" />
            </Button>
        </div>
        <div className="px-1 text-sm font-semibold">{post.likesCount.toLocaleString()} likes</div>
        {post.commentsCount > 0 && (
            <div className="px-1 text-sm text-muted-foreground">Lihat semua {post.commentsCount} komentar</div>
        )}
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
