
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAppSettings } from '@/app/actions/settings';
import MembershipCard from '@/components/members/MembershipCard';

const benefits = [
  'Akses ke jaringan pemuda inovator',
  'Kesempatan mengikuti program eksklusif',
  'Pengembangan diri dan portofolio',
  'Terlibat langsung dalam proyek berdampak',
];

export default function RegisterPage() {
    const { user, loading, signInWithPhone, verifyOtp } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'done'>('phone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memberId, setMemberId] = useState('');
    const [isRegistrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

    useEffect(() => {
        const checkRegistrationStatus = async () => {
            const settings = await getAppSettings();
            setRegistrationOpen(settings.isRegistrationOpen);
        };
        checkRegistrationStatus();
    }, []);

    useEffect(() => {
        if (user) {
            const year = new Date().getFullYear();
            const phoneSuffix = String(user.phoneNumber).slice(-6);
            setMemberId(`GL-${year}-${phoneSuffix}`);
            setStep('done');
        }
    }, [user]);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const phoneNumber = phone.startsWith('+') ? phone : `+62${phone.replace(/^0/, '')}`;
            await signInWithPhone(phoneNumber, 'recaptcha-container-register');
            setStep('otp');
            toast({ title: 'OTP Terkirim', description: 'Silakan periksa ponsel Anda untuk kode verifikasi.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim OTP. Silakan coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await verifyOtp(otp);
            // User is now signed in, useEffect will trigger update to 'done' step
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'OTP tidak valid. Silakan coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading || isRegistrationOpen === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4 relative overflow-hidden">
            <div className="absolute inset-0 -z-0">
                <Image src="https://picsum.photos/seed/community-gathering/1920/1080" alt="Community gathering" fill className="object-cover opacity-10" />
                 <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-secondary"></div>
            </div>
            <div className="w-full max-w-md z-10">
                <div className="text-center mb-6">
                    <Link href="/" className="inline-block">
                       <Image src="/logo.png" alt="Garda Lestari Logo" width={160} height={42} className="h-auto w-40" />
                    </Link>
                </div>
                
                {!isRegistrationOpen ? (
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle>Pendaftaran Ditutup</CardTitle>
                             <CardDescription className="flex justify-center">
                                <ShieldOff className="w-16 h-16 text-muted-foreground my-4"/>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Mohon maaf, pendaftaran anggota baru saat ini sedang ditutup. Silakan kembali lagi nanti.</p>
                        </CardContent>
                        <CardFooter>
                             <Button asChild className="w-full">
                                <Link href="/">Kembali ke Halaman Utama</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ) : step !== 'done' ? (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                         <div className="hidden md:flex flex-col gap-4 text-foreground/90">
                            <h2 className="font-headline text-3xl font-bold">Satu Langkah Lagi Menuju Perubahan</h2>
                            <p className="text-sm">Bergabunglah dengan ribuan pemuda lainnya dan dapatkan akses ke berbagai keuntungan eksklusif.</p>
                            <ul className="space-y-2 mt-2">
                                {benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-primary" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Card>
                            <CardHeader className="text-center">
                                <CardTitle>Daftar Akun</CardTitle>
                                <CardDescription>
                                {step === 'phone' ? 'Gunakan nomor telepon aktif Anda.' : 'Masukkan OTP untuk verifikasi.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {step === 'phone' ? (
                                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                        <Input
                                            type="tel"
                                            placeholder="cth. 08123456789"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                        <div id="recaptcha-container-register" className="flex justify-center"></div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Daftar
                                        </Button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                                        <Input
                                            type="text"
                                            placeholder="6-digit OTP"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                            required
                                        />
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Verifikasi & Buat Akun
                                        </Button>
                                    </form>
                                )}
                                <p className="mt-4 text-center text-xs text-muted-foreground">
                                    Sudah punya akun?{' '}
                                    <Link href="/login" className="font-semibold text-primary hover:underline">
                                        Masuk
                                    </Link>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 text-center">
                       <div className="space-y-2">
                            <h1 className="text-2xl font-bold font-headline">Pendaftaran Berhasil!</h1>
                            <p className="text-muted-foreground">Ini adalah Kartu Tanda Anggota (KTA) digital sementara Anda.</p>
                        </div>
                        {user && (
                            <MembershipCard
                                name={user.displayName || 'Anggota Baru'}
                                photoUrl={user.photoURL || ''}
                                memberId={memberId}
                                nik={user.nik || undefined}
                                profileUrl={user.username ? `/profile/${user.username}` : '#'}
                                joinDate={user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID') : ''}
                                position={user.position}
                            />
                        )}
                        <Button size="lg" onClick={() => router.push('/profile/verify')}>
                            Lanjutkan ke Verifikasi
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
