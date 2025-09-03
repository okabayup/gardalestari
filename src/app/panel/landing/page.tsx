
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { getAppSettings, updateAppSettings, AppSettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

type FormData = Omit<AppSettings, 'heroImageUrl' | 'aboutImageUrl'> & {
  heroImageFile?: FileList;
  aboutImageFile?: FileList;
};


export default function LandingPageSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<AppSettings | null>(null);
  
  const { register, control, handleSubmit, reset, watch } = useForm<FormData>();

  const heroImageFile = watch("heroImageFile");
  const aboutImageFile = watch("aboutImageFile");
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [aboutPreview, setAboutPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await getAppSettings();
        setCurrentSettings(settings);
        reset(settings);
        setHeroPreview(settings.heroImageUrl);
        setAboutPreview(settings.aboutImageUrl);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat pengaturan' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  useEffect(() => {
    if (heroImageFile && heroImageFile.length > 0) {
      const file = heroImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [heroImageFile]);

  useEffect(() => {
    if (aboutImageFile && aboutImageFile.length > 0) {
      const file = aboutImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAboutPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [aboutImageFile]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
        const updatePayload = {
            ...data,
            heroImageFile: data.heroImageFile?.[0],
            aboutImageFile: data.aboutImageFile?.[0],
        };
      await updateAppSettings(updatePayload);
      toast({ title: 'Halaman Utama diperbarui!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Pengaturan Halaman Utama</h1>
        <p className="text-muted-foreground">Kelola konten yang tampil di halaman depan website Anda.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gambar</CardTitle>
            <CardDescription>Ubah gambar utama yang tampil di halaman depan.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="heroImageFile">Gambar Hero</Label>
                {heroPreview && <Image src={heroPreview} alt="Hero preview" width={400} height={200} className="rounded-md aspect-video object-cover" />}
                <Input id="heroImageFile" type="file" {...register("heroImageFile")} accept="image/*" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="aboutImageFile">Gambar Tentang Kami</Label>
                {aboutPreview && <Image src={aboutPreview} alt="About preview" width={400} height={300} className="rounded-md aspect-[4/3] object-cover" />}
                <Input id="aboutImageFile" type="file" {...register("aboutImageFile")} accept="image/*" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Statistik Landing Page</CardTitle>
            <CardDescription>Tambahkan angka "dummy" untuk dijumlahkan dengan data asli.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="space-y-2">
                <Label htmlFor="dummyMembers">Anggota (Tambahan)</Label>
                <Input id="dummyMembers" type="number" {...register("dummyMembers")} placeholder="0" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="dummyPrograms">Program (Tambahan)</Label>
                <Input id="dummyPrograms" type="number" {...register("dummyPrograms")} placeholder="0" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="dummyEvents">Acara (Tambahan)</Label>
                <Input id="dummyEvents" type="number" {...register("dummyEvents")} placeholder="0" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="dummyNews">Publikasi (Tambahan)</Label>
                <Input id="dummyNews" type="number" {...register("dummyNews")} placeholder="0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Sosial</CardTitle>
            <CardDescription>Masukkan tautan lengkap ke profil media sosial Anda.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" {...register("instagram")} placeholder="https://instagram.com/..." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" {...register("linkedin")} placeholder="https://linkedin.com/in/..." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" {...register("facebook")} placeholder="https://facebook.com/..." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="twitter">X / Twitter</Label>
                <Input id="twitter" {...register("twitter")} placeholder="https://x.com/..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
