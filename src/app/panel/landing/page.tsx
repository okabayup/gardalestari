

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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

type FormData = Omit<AppSettings, 'heroImageUrl' | 'aboutImageUrl' | 'orgChartImageUrl'> & {
  heroImageFile?: FileList;
  aboutImageFile?: FileList;
  orgChartImageFile?: FileList;
};


export default function LandingPageSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, watch, control } = useForm<FormData>();

  const heroImageFile = watch("heroImageFile");
  const aboutImageFile = watch("aboutImageFile");
  const orgChartImageFile = watch("orgChartImageFile");

  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [aboutPreview, setAboutPreview] = useState<string | null>(null);
  const [orgChartPreview, setOrgChartPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await getAppSettings();
        reset(settings);
        setHeroPreview(settings.heroImageUrl);
        setAboutPreview(settings.aboutImageUrl);
        setOrgChartPreview(settings.orgChartImageUrl);
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
      setHeroPreview(URL.createObjectURL(file));
      return () => URL.revokeObjectURL(heroPreview!);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroImageFile]);

  useEffect(() => {
    if (aboutImageFile && aboutImageFile.length > 0) {
      const file = aboutImageFile[0];
      setAboutPreview(URL.createObjectURL(file));
       return () => URL.revokeObjectURL(aboutPreview!);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aboutImageFile]);
  
  useEffect(() => {
    if (orgChartImageFile && orgChartImageFile.length > 0) {
      const file = orgChartImageFile[0];
       setOrgChartPreview(URL.createObjectURL(file));
       return () => URL.revokeObjectURL(orgChartPreview!);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgChartImageFile]);


  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    
    // Append all form data to the FormData object
    Object.entries(data).forEach(([key, value]) => {
        if (key.endsWith('File') && value instanceof FileList && value.length > 0) {
            formData.append(key, value[0]);
        } else if (value !== undefined && value !== null && !key.endsWith('File')) {
             formData.append(key, String(value));
        }
    });

    try {
      await updateAppSettings(formData);
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
            <CardTitle>Pengaturan Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label htmlFor="isInstallForced">Paksa Instalasi Aplikasi di Mobile</Label>
                    <p className="text-xs text-muted-foreground">
                    Jika aktif, pengguna mobile akan melihat dialog untuk menginstal aplikasi.
                    </p>
                </div>
                <Controller
                    name="isInstallForced"
                    control={control}
                    render={({ field }) => (
                    <Switch
                        id="isInstallForced"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    )}
                />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gambar</CardTitle>
            <CardDescription>Ubah gambar utama yang tampil di halaman depan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <Label htmlFor="heroImageFile">Gambar Hero</Label>
                  {heroPreview && <Image src={heroPreview} alt="Hero preview" width={400} height={200} className="rounded-md aspect-video object-cover" />}
                  <Input id="heroImageFile" type="file" {...register("heroImageFile")} accept="image/*" />
                  <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="aboutImageFile">Gambar Tentang Kami</Label>
                  {aboutPreview && <Image src={aboutPreview} alt="About preview" width={400} height={300} className="rounded-md aspect-[4/3] object-cover" />}
                  <Input id="aboutImageFile" type="file" {...register("aboutImageFile")} accept="image/*" />
                  <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
              </div>
            </div>
             <Separator />
             <div className="space-y-2">
                  <Label htmlFor="orgChartImageFile">Gambar Struktur Organisasi</Label>
                  {orgChartPreview && <Image src={orgChartPreview} alt="Org chart preview" width={400} height={500} className="rounded-md aspect-[4/5] object-cover border" />}
                  <Input id="orgChartImageFile" type="file" {...register("orgChartImageFile")} accept="image/*" />
                  <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
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
