
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getAppTesterAppBySlug, AppTesterApp, submitTesterApplication } from '@/app/actions/app-testers';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle, TestTube2 } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
    name: z.string().min(1, "Nama lengkap wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    waNumber: z.string().min(10, "Nomor WhatsApp tidak valid"),
    reason: z.string().min(10, "Alasan bergabung wajib diisi, minimal 10 karakter."),
});
type FormData = z.infer<typeof formSchema>;

export default function AppTesterApplicationPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { toast } = useToast();
    const [app, setApp] = useState<AppTesterApp | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (slug) {
            getAppTesterAppBySlug(slug)
                .then(data => {
                    if (data) {
                        setApp(data);
                    } else {
                        setError("Program pengujian aplikasi tidak ditemukan.");
                    }
                })
                .catch(() => setError("Gagal memuat detail aplikasi."))
                .finally(() => setLoading(false));
        }
    }, [slug]);

    const onSubmit = async (data: FormData) => {
        if (!app) return;
        setIsSubmitting(true);
        try {
            await submitTesterApplication({
                ...data,
                appId: app.id!,
                appName: app.name,
            });
            setIsSubmitted(true);
        } catch (e) {
            toast({
                variant: 'destructive',
                title: "Gagal Mengirim Aplikasi",
                description: (e as Error).message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        }

        if (error) {
            return (
                 <div className="text-center text-destructive p-10 border-2 border-dashed border-destructive/50 rounded-lg">
                    <AlertTriangle className="mx-auto h-10 w-10 mb-2"/>
                    <p>{error}</p>
                </div>
            )
        }

        if (isSubmitted) {
            return (
                 <div className="text-center p-10">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4"/>
                    <h3 className="text-xl font-bold">Aplikasi Anda Telah Terkirim!</h3>
                    <p className="text-muted-foreground mt-2">
                        Terima kasih telah mendaftar. Tim kami akan meninjau aplikasi Anda dan akan menghubungi Anda melalui email atau WhatsApp jika terpilih.
                    </p>
                </div>
            )
        }
        
        if (app) {
            return (
                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register('email')} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="waNumber">Nomor WhatsApp</Label>
                            <Input id="waNumber" {...register('waNumber')} placeholder="08123..." />
                            {errors.waNumber && <p className="text-xs text-destructive">{errors.waNumber.message}</p>}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="reason">Mengapa Anda tertarik menjadi penguji?</Label>
                        <Textarea id="reason" {...register('reason')} placeholder="Jelaskan pengalaman Anda atau alasan mengapa Anda cocok..." />
                        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Kirim Aplikasi
                    </Button>
                </form>
            )
        }
        return null;
    }


    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingHeader />
            <main className="flex-1">
                <div className="container py-12 md:py-16 max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <TestTube2 className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h1 className="font-headline text-3xl font-bold">Pendaftaran Penguji Aplikasi</h1>
                        <p className="text-muted-foreground mt-2">
                            Daftar untuk menjadi penguji aplikasi <span className="font-semibold text-foreground">{app?.name || '...'}</span>.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Formulir Pendaftaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {renderContent()}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
