
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, reset } = useForm<AppSettings>();

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

  const onSubmit = async (data: AppSettings) => {
    setIsSubmitting(true);
    try {
      await updateAppSettings({ isRegistrationOpen: data.isRegistrationOpen });
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
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan global untuk aplikasi Anda.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Pendaftaran</CardTitle>
            <CardDescription>
              Atur apakah pengguna baru dapat mendaftar ke aplikasi atau tidak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label htmlFor="isRegistrationOpen">Buka Pendaftaran Anggota</Label>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, tombol & halaman registrasi akan ditampilkan.
                </p>
              </div>
              <Controller
                name="isRegistrationOpen"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isRegistrationOpen"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
