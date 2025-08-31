
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createPost } from '@/app/actions/posts';
import { Loader2, ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';

export default function NewPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !user) {
      toast({
        variant: 'destructive',
        title: 'Data tidak lengkap',
        description: 'Mohon unggah gambar untuk postingan Anda.',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost(caption, imageFile, user.uid);
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
              <div 
                className="relative w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Pratinjau gambar" layout="fill" objectFit="cover" className="rounded-lg" />
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12" />
                    <p className="mt-2 text-sm">Klik untuk mengunggah gambar</p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>
              <Textarea
                placeholder="Tulis caption Anda di sini..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || !imageFile}>
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
