
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const MembershipCard = ({ name, email, photoUrl, memberId }: { name: string, email: string, photoUrl: string, memberId: string }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

    return (
        <Card className="w-full max-w-sm bg-gradient-to-br from-primary via-green-700 to-accent text-primary-foreground shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="h-8 w-8" />
                        <CardTitle className="font-headline text-xl">Garda Lestari</CardTitle>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest">Anggota</span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-24 w-24 border-4 border-background/50">
                    <AvatarImage src={photoUrl} alt={name} />
                    <AvatarFallback className="text-3xl text-primary">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-2xl font-bold font-headline">{name}</p>
                    <p className="text-sm opacity-80">{email}</p>
                </div>
                <div>
                    <p className="text-xs opacity-80 uppercase">ID Anggota</p>
                    <p className="font-mono text-lg tracking-wider">{memberId}</p>
                </div>
            </CardContent>
        </Card>
    );
};


export default function RegisterPage() {
    const { user, loading, signInWithPhone, verifyOtp } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'done'>('phone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memberId, setMemberId] = useState('');

    useEffect(() => {
        if (user) {
            setMemberId(`GL-${new Date().getFullYear()}-${String(user.phoneNumber).slice(-6)}`);
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


    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold">
                        <Logo className="h-8 w-8 text-primary" />
                        <span className="font-headline text-2xl">Garda Lestari</span>
                    </Link>
                </div>

                {step !== 'done' ? (
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle>Bergabung dengan Komunitas Kami</CardTitle>
                            <CardDescription>
                               {step === 'phone' ? 'Buat akun Anda untuk memulai.' : 'Masukkan OTP untuk verifikasi nomor Anda.'}
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
                                        Daftar dengan Nomor Telepon
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
                ) : (
                    <div className="flex flex-col items-center gap-6 text-center">
                       <div className="space-y-2">
                            <h1 className="text-2xl font-bold font-headline">Pendaftaran Berhasil!</h1>
                            <p className="text-muted-foreground">Ini adalah Kartu Tanda Anggota (KTA) digital Anda.</p>
                        </div>
                        <MembershipCard
                            name={user?.displayName || 'Anggota Baru'}
                            email={user?.email || (user?.phoneNumber || '')}
                            photoUrl={user?.photoURL || ''}
                            memberId={memberId}
                        />
                        <Button size="lg" onClick={() => router.push('/feed')}>
                            Masuk ke Beranda
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
