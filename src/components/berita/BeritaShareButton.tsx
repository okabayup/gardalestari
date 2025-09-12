
'use client';

import { logAnalyticsEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';
import { BeritaPost } from '@/app/actions/berita';

export default function BeritaShareButton({ post }: { post: BeritaPost }) {
    const { toast } = useToast();

    const handleShare = async () => {
        if (!post) return;
        const shareData = {
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        };
        if (navigator.share && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            logAnalyticsEvent('share', { content_type: 'berita', item_id: post.id });
          } catch (err) {
            console.error('Error sharing:', err);
          }
        } else {
          navigator.clipboard.writeText(window.location.href);
          toast({
            title: 'Tautan disalin!',
            description: 'Tautan berita telah disalin ke clipboard Anda.',
          });
        }
    };

    return (
        <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Bagikan</span>
        </Button>
    )
}
