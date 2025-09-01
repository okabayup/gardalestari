
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAppSettings, updateAppSettings, AppSettings } from '@/app/actions/settings';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type FormData = {
  heroImageFile?: FileList;
  aboutImageFile?: FileList;
};

export default function LandingSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentSettings, setCurrentSettings] = useState<Partial<AppSettings>>({});
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [aboutPreview, setAboutPreview] = useState<string | null>(null);

  const form = useForm<FormData>();

  useEffect(() => {
    const fetchSettings = async () => {
      setPageLoading(true);
      const settings = await getAppSettings();
      setCurrentSettings(settings);
      setHeroPreview(settings.heroImageUrl);
      setAboutPreview(settings.aboutImageUrl);
      setPageLoading(false);
    };
    fetchSettings();
  }, []);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: 'hero' | 'about') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fieldName === 'hero') {
          setHeroPreview(reader.result as string);
        } else {
          setAboutPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: { heroImageFile?: File, aboutImageFile?: File } = {};
      if (data.heroImageFile && data.heroImageFile.length > 0) {
        payload.heroImageFile = data.heroImageFile[0];
      }
      if (data.aboutImageFile && data.aboutImageFile.length > 0) {
        payload.aboutImageFile = data.aboutImageFile[0];
      }

      if (Object.keys(payload).length === 0) {
        toast({ variant: 'destructive', title: 'Tidak ada perubahan', description: 'Pilih file baru untuk diunggah.' });
        setLoading(false);
        return;
      }
      
      await updateAppSettings(payload);
      
      toast({
        title: 'Pengaturan Disimpan!',
        description: 'Gambar halaman utama telah berhasil diperbarui.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan pengaturan.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Kembali ke Dasbor
        </Button>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Gambar Halaman Utama</CardTitle>
                        <CardDescription>Kelola gambar yang ditampilkan di halaman depan (landing page).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="heroImageFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gambar Hero Section</FormLabel>
                                    <CardDescription>Rekomendasi rasio 16:9, misal 1920x1080px.</CardDescription>
                                    <div className="relative mt-2 aspect-video w-full max-w-lg overflow-hidden rounded-md border">
                                        {heroPreview ? (
                                            <Image src={heroPreview} alt="Pratinjau Hero" fill className="object-cover"/>
                                        ): (
                                            <div className="flex flex-col items-center justify-center h-full bg-muted">
                                                <ImageIcon className="h-12 w-12 text-muted-foreground"/>
                                            </div>
                                        )}
                                    </div>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="image/jpeg, image/png, image/webp" 
                                            onChange={(e) => {
                                                field.onChange(e.target.files);
                                                handleFileChange(e, 'hero');
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="aboutImageFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gambar "Tentang Kami"</FormLabel>
                                    <CardDescription>Rekomendasi rasio 4:3, misal 800x600px.</CardDescription>
                                     <div className="relative mt-2 aspect-[4/3] w-full max-w-md overflow-hidden rounded-md border">
                                        {aboutPreview ? (
                                            <Image src={aboutPreview} alt="Pratinjau Tentang Kami" fill className="object-cover"/>
                                        ): (
                                            <div className="flex flex-col items-center justify-center h-full bg-muted">
                                                <ImageIcon className="h-12 w-12 text-muted-foreground"/>
                                            </div>
                                        )}
                                    </div>
                                    <FormControl>
                                       <Input 
                                            type="file" 
                                            accept="image/jpeg, image/png, image/webp" 
                                            onChange={(e) => {
                                                field.onChange(e.target.files);
                                                handleFileChange(e, 'about');
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan
                  </Button>
                </div>
            </form>
        </Form>
      </div>
    </MainLayout>
  );
}
