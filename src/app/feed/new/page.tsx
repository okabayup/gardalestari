
'use client';

import { useState, useRef, ChangeEvent, MouseEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createPost } from '@/app/actions/posts';
import type { Mention } from '@/app/actions/posts';
import { searchUsers } from '@/app/actions/user';
import type { PublicUser } from '@/lib/definitions';
import { Loader2, ArrowLeft, ImageIcon, X, Tag } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from 'use-debounce';
import { logAnalyticsEvent } from '@/lib/analytics';

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

const UserTag = ({ mention, onRemove }: { mention: Mention, onRemove: () => void }) => (
  <div
    className="absolute p-1 pr-2 bg-black/70 text-white text-xs rounded-md flex items-center gap-1 cursor-pointer"
    style={{ left: `${mention.x}%`, top: `${mention.y}%`, transform: 'translate(-50%, -50%)' }}
    onClick={(e) => e.stopPropagation()}
  >
    <span>{mention.username}</span>
    <button type="button" onClick={onRemove} className="bg-white/20 rounded-full h-3 w-3 flex items-center justify-center text-white">
      <X className="h-2 w-2" />
    </button>
  </div>
);

const UserSearchPopover = ({ onSelectUser, children }: { onSelectUser: (user: PublicUser) => void, children: React.ReactNode }) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 300);
    const [results, setResults] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            if (debouncedSearch.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            const users = await searchUsers(debouncedSearch);
            setResults(users);
            setLoading(false);
        };
        fetchUsers();
    }, [debouncedSearch]);
    
    const handleSelect = (user: PublicUser) => {
        onSelectUser(user);
        setIsOpen(false);
        setSearch('');
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-64 p-2">
                <div className="space-y-2">
                    <Input
                        placeholder="Cari nama pengguna..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {loading && <div className="text-center p-2"><Loader2 className="h-4 w-4 animate-spin mx-auto"/></div>}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {results.map(user => (
                            <div key={user.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handleSelect(user)}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{user.username}</p>
                                    <p className="text-xs text-muted-foreground">{user.fullName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};


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
        setMediaFiles(prev => [...prev, ...newMediaPreviews].slice(0, 10)); // Batasi 10 media
    }
  };

  const removeMedia = (indexToRemove: number) => {
    URL.revokeObjectURL(mediaFiles[indexToRemove].previewUrl);
    setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleSelectUserToTag = (mediaIndex: number, selectedUser: PublicUser, position: {x: number, y: number}) => {
    setMediaFiles(prev => prev.map((media, i) => {
      if (i === mediaIndex) {
        if (media.mentions.some(m => m.userId === selectedUser.id)) return media;
        
        const newMention: Mention = {
          userId: selectedUser.id,
          username: selectedUser.username,
          ...position,
        };
        return { ...media, mentions: [...media.mentions, newMention] };
      }
      return media;
    }));
  };
  
  const removeMention = (mediaIndex: number, mentionIndex: number) => {
    setMediaFiles(prev => prev.map((media, i) => {
      if (i === mediaIndex) {
        return { ...media, mentions: media.mentions.filter((_, j) => j !== mentionIndex) };
      }
      return media;
    }));
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
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('authorId', user.uid);
      
      const mediaPayloads = mediaFiles.map(mf => ({ mentions: mf.mentions }));
      formData.append('mediaPayloads', JSON.stringify(mediaPayloads));

      mediaFiles.forEach(mf => {
        formData.append('files', mf.file);
      });

      await createPost(formData);
      
      logAnalyticsEvent('create_post', { media_count: mediaFiles.length });
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
      mediaFiles.forEach(mf => URL.revokeObjectURL(mf.previewUrl));
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
            <CardDescription>Bagikan momen atau wawasan Anda. Klik pada media untuk menandai pengguna.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
               {mediaFiles.length === 0 ? (
                 <MediaUploadPlaceholder onClick={() => fileInputRef.current?.click()} />
              ) : (
                <div className="w-full aspect-video rounded-lg flex flex-col items-center justify-center text-muted-foreground relative bg-black">
                  <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                      {mediaFiles.map((media, index) => (
                        <CarouselItem key={index} className="relative w-full h-full flex items-center justify-center">
                          <UserSearchPopover onSelectUser={(user) => {
                            const container = document.getElementById(`media-container-${index}`);
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const { clientX, clientY } = (container as any).lastClickPosition || { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
                            const x = ((clientX - rect.left) / rect.width) * 100;
                            const y = ((clientY - rect.top) / rect.height) * 100;
                            handleSelectUserToTag(index, user, { x, y });
                          }}>
                            <div 
                              id={`media-container-${index}`}
                              className="w-full h-full cursor-pointer"
                              onClick={(e: MouseEvent<HTMLDivElement>) => {
                                (e.currentTarget as any).lastClickPosition = { clientX: e.clientX, clientY: e.clientY };
                              }}>
                                {media.type === 'image' ? (
                                  <Image src={media.previewUrl} alt="Pratinjau media" fill className="object-contain" />
                                ) : (
                                  <video src={media.previewUrl} className="w-full h-full object-contain" controls muted loop />
                                )}
                            </div>
                          </UserSearchPopover>

                          {media.mentions.map((mention, mentionIndex) => (
                            <UserTag key={mention.userId} mention={mention} onRemove={() => removeMention(index, mentionIndex)} />
                          ))}

                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMedia(index);
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
                  {mediaFiles.length < 10 && (
                    <Button type="button" variant="outline" size="sm" className="absolute bottom-2 z-10 bg-background/70" onClick={() => fileInputRef.current?.click()}>
                        Tambah Media
                    </Button>
                  )}
                </div>
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
