

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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type FormData = Record<NotificationType, { message: string; isActive: boolean }>;

const templateGroups: { group: string; templates: NotificationType[] }[] = [
  {
    group: 'Dokumen & Surat',
    templates: ['document_submission', 'document_approved', 'document_rejected'],
  },
  {
    group: 'Keanggotaan & Verifikasi',
    templates: ['member_verified_permanent', 'member_verification_rejected', 'member_position_updated', 'kta_activated'],
  },
  {
    group: 'Proyek & Tugas',
    templates: ['new_task_assigned'],
  },
  {
    group: 'Pengumuman Umum',
    templates: ['new_program_announcement', 'event_reminder'],
  },
];

export default function WhatsappTemplatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allTemplates, setAllTemplates] = useState<Record<NotificationType, WhatsAppTemplate>>({} as any);

  const { control, handleSubmit, reset } = useForm<FormData>();

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const templates = await getWhatsappTemplates();
        setAllTemplates(templates);

        const formData: Partial<FormData> = {};
        for (const key in templates) {
            const templateKey = key as NotificationType;
            formData[templateKey] = {
                message: templates[templateKey].message,
                isActive: templates[templateKey].isActive,
            };
        }
        reset(formData as FormData);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold">Template Notifikasi WhatsApp</h1>
          <p className="text-muted-foreground">Aktifkan, nonaktifkan, dan ubah isi pesan untuk notifikasi otomatis.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.push('/panel/whatsapp')} className="w-1/2 sm:w-auto">Kembali</Button>
            <Button type="submit" disabled={isSaving} className="w-1/2 sm:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Semua
            </Button>
        </div>
      </div>
      
      <Accordion type="multiple" defaultValue={templateGroups.map(g => g.group)} className="w-full space-y-4">
        {templateGroups.map(group => (
             <AccordionItem key={group.group} value={group.group} className="border rounded-lg bg-card">
                 <AccordionTrigger className="p-4">
                    <span className="font-semibold">{group.group}</span>
                </AccordionTrigger>
                 <AccordionContent className="p-4 pt-0 space-y-4">
                    {group.templates.map(templateKey => {
                        const template = allTemplates[templateKey];
                        if (!template) return null;
                        return (
                            <Card key={templateKey} className="bg-background">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">{template.label}</CardTitle>
                                            <CardDescription className="text-xs">
                                                Placeholder: {template.placeholders?.map(p => <Badge key={p} variant="secondary" className="mr-1">{p}</Badge>) || 'Tidak ada'}
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
                 </AccordionContent>
             </AccordionItem>
        ))}
      </Accordion>
    </form>
  );
}
