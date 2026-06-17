
'use client';

import { CommentWithAuthor } from '@/app/actions/posts';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';

interface CommentListProps {
    comments: CommentWithAuthor[];
}

export default function CommentList({ comments }: CommentListProps) {
    if (comments.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Belum ada komentar.
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 space-y-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                            <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-sm">
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
        </ScrollArea>
    )
}
