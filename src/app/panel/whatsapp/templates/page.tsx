
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { getWhatsappTemplates, updateWhatsappTemplates, WhatsAppTemplate, NotificationType } from '@/app/actions/whatsapp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type FormData = Record<NotificationType, { message: string; isActive: boolean }>;

export default function WhatsappTemplatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [placeholders, setPlaceholders] = useState<Record<NotificationType, string[]>>({} as any);

  const { control, handleSubmit, reset } = useForm<FormData>();

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const templates = await getWhatsappTemplates();
        const formData: Partial<FormData> = {};
        const placeholderData: Partial<Record<NotificationType, string[]>> = {};
        for (const key in templates) {
            const templateKey = key as NotificationType;
            formData[templateKey] = {
                message: templates[templateKey].message,
                isActive: templates[templateKey].isActive,
            };
            placeholderData[templateKey] = templates[templateKey].placeholders;
        }
        reset(formData as FormData);
        setPlaceholders(placeholderData as Record<NotificationType, string[]>);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat template' });
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [reset, toast]);
  
  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
        await updateWhatsappTemplates(data);
        toast({ title: 'Template berhasil disimpan!' });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  }


  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Template Notifikasi WhatsApp</h1>
          <p className="text-muted-foreground">Aktifkan, nonaktifkan, dan ubah isi pesan untuk notifikasi otomatis.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/panel/whatsapp')}>Kembali</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Semua Perubahan
            </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {Object.keys(placeholders).map((key) => {
          const templateKey = key as NotificationType;
          return (
            <Card key={templateKey}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle>{placeholders[templateKey]?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || templateKey}</CardTitle>
                        <CardDescription>
                            Placeholder tersedia: {placeholders[templateKey]?.map(p => <Badge key={p} variant="outline" className="mr-1">{p}</Badge>) || 'Tidak ada'}
                        </CardDescription>
                    </div>
                     <Controller
                        name={`${templateKey}.isActive`}
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Switch id={`active-${templateKey}`} checked={field.value} onCheckedChange={field.onChange} />
                                <Label htmlFor={`active-${templateKey}`}>Aktif</Label>
                            </div>
                        )}
                    />
                </div>
              </CardHeader>
              <CardContent>
                <Controller
                    name={`${templateKey}.message`}
                    control={control}
                    render={({ field }) => (
                       <Textarea {...field} rows={4} placeholder="Masukkan template pesan Anda di sini..."/>
                    )}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </form>
  );
}
