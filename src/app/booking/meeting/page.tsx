
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createMeetingBooking } from '@/app/actions/booking';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Handshake, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
    customerName: z.string().min(1, "Nama lengkap wajib diisi"),
    customerEmail: z.string().email("Format email tidak valid"),
    customerPhone: z.string().min(10, "Nomor telepon tidak valid"),
    meetingTopic: z.string().min(1, "Topik meeting wajib diisi"),
    meetingDuration: z.string().min(1, "Durasi wajib dipilih"),
});

type FormData = z.infer<typeof formSchema>;

export default function MeetingBookingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                // Dummy values for Booking type compatibility, won't be used in meeting logic
                bookingDate: Timestamp.now(),
                participants: 1,
            };
            await createMeetingBooking(payload);
            toast({ title: "Permintaan Terkirim!", description: "Tim kami akan segera menghubungi Anda." });
            setIsSubmitted(true);
        } catch (error) {
            toast({ variant: 'destructive', title: "Gagal Mengirim Permintaan", description: (error as Error).message });
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
             <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="mt-4">Permintaan Anda Telah Terkirim!</CardTitle>
                        <CardDescription>
                            Terima kasih telah menghubungi kami. Tim Garda Lestari akan segera meninjau permintaan Anda dan menghubungi Anda untuk penjadwalan lebih lanjut.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingHeader />
            <main className="flex-1">
                <div className="container py-12 md:py-16 max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <Handshake className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h1 className="font-headline text-3xl font-bold">Jadwalkan Meeting</h1>
                        <p className="text-muted-foreground">Isi formulir di bawah untuk menjadwalkan audiensi atau diskusi dengan tim kami.</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Formulir Permintaan Meeting</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerName">Nama Lengkap</Label>
                                        <Input id="customerName" {...register('customerName')} />
                                        {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customerEmail">Email</Label>
                                        <Input id="customerEmail" type="email" {...register('customerEmail')} />
                                        {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerPhone">Nomor Telepon (WhatsApp)</Label>
                                    <Input id="customerPhone" {...register('customerPhone')} placeholder="08123456789" />
                                    {errors.customerPhone && <p className="text-xs text-destructive">{errors.customerPhone.message}</p>}
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="meetingDuration">Estimasi Durasi</Label>
                                     <Controller
                                        name="meetingDuration"
                                        control={control}
                                        render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Pilih durasi meeting..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30min">30 Menit</SelectItem>
                                                <SelectItem value="60min">60 Menit</SelectItem>
                                                <SelectItem value="custom">Lebih dari 1 jam</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        )}
                                    />
                                    {errors.meetingDuration && <p className="text-xs text-destructive">{errors.meetingDuration.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="meetingTopic">Topik Pembahasan</Label>
                                    <Textarea id="meetingTopic" {...register('meetingTopic')} placeholder="Jelaskan secara singkat topik yang ingin Anda diskusikan..." />
                                    {errors.meetingTopic && <p className="text-xs text-destructive">{errors.meetingTopic.message}</p>}
                                </div>
                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Kirim Permintaan
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}

