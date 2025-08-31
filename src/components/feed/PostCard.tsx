
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Post = {
  id: number;
  author: {
    name: string;
    avatarUrl: string;
  };
  imageUrl: string;
  imageHint: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
};

interface PostCardProps {
  post: Post;
  onToggleLike: () => void;
}

export default function PostCard({ post, onToggleLike }: PostCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 p-3">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <span className="font-semibold">{post.author.name}</span>
            <span className="text-xs text-muted-foreground">{post.timestamp}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-square relative w-full">
            <Image
                src={post.imageUrl}
                alt={`Post by ${post.author.name}`}
                data-ai-hint={post.imageHint}
                fill
                className="object-cover"
            />
        </div>
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
        <div className="px-1 text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
        <div className="px-1 text-sm text-muted-foreground">View all {post.comments} comments</div>
      </CardFooter>
    </Card>
  );
};
