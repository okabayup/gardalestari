
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { getAppSettings, updateAppSettings, AppSettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const FeatureSwitch = ({ name, control, label, description }: { name: keyof AppSettings, control: any, label: string, description: string }) => (
    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
      <div className="space-y-0.5">
        <Label htmlFor={name}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Switch
            id={name}
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
);


export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, reset, getValues } = useForm<AppSettings>();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await getAppSettings();
        reset(settings);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat pengaturan' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async () => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    const data = getValues();
    
    // Append all form data to the FormData object
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
             formData.append(key, String(value));
        }
    });

    try {
      await updateAppSettings(formData);
      toast({ title: 'Pengaturan disimpan!' });
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Pengaturan Aplikasi</h1>
            <p className="text-muted-foreground">Kelola pengaturan global untuk aplikasi Anda.</p>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengaturan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manajemen Fitur</CardTitle>
            <CardDescription>
              Aktifkan atau non-aktifkan modul-modul utama di aplikasi. Perubahan akan langsung terlihat oleh semua pengguna.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureSwitch name="isRegistrationOpen" control={control} label="Buka Pendaftaran" description="Izinkan pengguna baru untuk mendaftar."/>
              <FeatureSwitch name="isReferralEnabled" control={control} label="Sistem Rujukan (Referral)" description="Aktifkan kode referral untuk anggota."/>
              <FeatureSwitch name="isPointsEnabled" control={control} label="Sistem Poin & Hadiah" description="Aktifkan perolehan poin dan penukaran hadiah."/>
              <FeatureSwitch name="isAchievementsEnabled" control={control} label="Modul Prestasi" description="Tampilkan & kelola prestasi anggota."/>
              <FeatureSwitch name="isIdeasEnabled" control={control} label="Lab Ide & Aksi" description="Aktifkan fitur pengajuan ide dan solusi."/>
              <FeatureSwitch name="isEvotingEnabled" control={control} label="E-Voting" description="Aktifkan sistem pemungutan suara elektronik."/>
              <FeatureSwitch name="isTestimonialsEnabled" control={control} label="Testimoni di Landing Page" description="Tampilkan bagian testimoni di halaman utama."/>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
