
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createPost, Mention } from '@/app/actions/posts';
import { Loader2, ArrowLeft, Image as ImageIcon, X, Video } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface MediaPreview {
    file: File;
    previewUrl: string;
    type: 'image' | 'video';
    mentions: Mention[];
}

const MediaUploadPlaceholder = ({ onClick }: { onClick: () => void }) => (
    <div
        className="w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onClick}
    >
        <ImageIcon className="h-12 w-12" />
        <p className="mt-2 text-sm">Klik untuk mengunggah gambar/video</p>
    </div>
);

const MediaPreviewCarousel = ({ 
    mediaFiles, 
    onRemove,
    onAddMore
}: { 
    mediaFiles: MediaPreview[], 
    onRemove: (index: number) => void,
    onAddMore: () => void
}) => (
    <div className="w-full aspect-video border rounded-lg flex flex-col items-center justify-center text-muted-foreground relative bg-black">
      <Carousel className="w-full h-full">
        <CarouselContent className="h-full">
          {mediaFiles.map((media, index) => (
            <CarouselItem key={index} className="relative w-full h-full flex items-center justify-center">
              {media.type === 'image' ? (
                <Image src={media.previewUrl} alt="Pratinjau media" fill className="object-contain" />
              ) : (
                <video src={media.previewUrl} className="w-full h-full object-contain" controls muted loop />
              )}
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Hapus media</span>
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {mediaFiles.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
      <Button type="button" variant="outline" size="sm" className="absolute bottom-2 z-10 bg-background/70" onClick={onAddMore}>
        Tambah Media
      </Button>
    </div>
);

export default function NewPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        const newMediaPreviews: MediaPreview[] = Array.from(files).map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image',
            mentions: []
        }));
        setMediaFiles(prev => [...prev, ...newMediaPreviews]);
    }
  };

  const removeMedia = (indexToRemove: number) => {
    setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaFiles.length === 0 || !user) {
      toast({
        variant: 'destructive',
        title: 'Data tidak lengkap',
        description: 'Mohon unggah setidaknya satu gambar atau video untuk postingan Anda.',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const mediaPayload = mediaFiles.map(mf => ({
        file: mf.file,
        mentions: mf.mentions
      }));
      await createPost(caption, mediaPayload, user.uid);
      toast({
        title: 'Postingan berhasil dibuat!',
      });
      router.push('/feed');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal membuat postingan',
        description: (error as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Buat Postingan Baru</CardTitle>
            <CardDescription>Bagikan momen atau wawasan Anda dengan komunitas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {mediaFiles.length === 0 ? (
                 <MediaUploadPlaceholder onClick={() => fileInputRef.current?.click()} />
              ) : (
                 <MediaPreviewCarousel 
                    mediaFiles={mediaFiles} 
                    onRemove={removeMedia}
                    onAddMore={() => fileInputRef.current?.click()}
                 />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif, video/mp4, video/quicktime"
                multiple
              />
              <Textarea
                placeholder="Tulis caption Anda di sini... Gunakan @ untuk menyebut teman."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || mediaFiles.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  'Bagikan Postingan'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
