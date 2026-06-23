
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAppSettings } from '@/app/actions/settings';
import { Label } from '@/components/ui/label';
import { logError } from '@/app/actions/errors';
import Cookies from 'js-cookie';
import { usePathname } from 'next/navigation';

const benefits = [
  'Akses ke jaringan pemuda inovator',
  'Kesempatan mengikuti program eksklusif',
  'Pengembangan diri dan portofolio',
  'Terlibat langsung dalam proyek berdampak',
];

const normalizePhoneNumber = (phone: string): string => {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  } else if (!normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }
  return `+${normalized}`;
};

export default function RegisterPage() {
  const { user, loading, signInWithPhone, verifyOtp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referrerUsername, setReferrerUsername] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      const settings = await getAppSettings();
      setRegistrationOpen(settings.isRegistrationOpen);
    };
    checkRegistrationStatus();
  }, []);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      Cookies.set('referrer', ref, { expires: 7 });
      setReferrerUsername(ref);
    } else {
      const cookieRef = Cookies.get('referrer');
      if (cookieRef) setReferrerUsername(cookieRef);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push('/profile/me');
    }
  }, [user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCountdown(60);
    const phoneNumber = normalizePhoneNumber(phone);

    try {
      await signInWithPhone(phoneNumber);
      setStep('otp');
      toast({ title: 'OTP Terkirim', description: `Silakan periksa ponsel Anda di nomor ${phoneNumber}.` });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim OTP. Pastikan nomor valid dan coba lagi.' });
      logError({
        message: err.message,
        stack: err.stack,
        context: 'register-otp-send',
        userPhone: phoneNumber,
        path: pathname,
      });
      setCountdown(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await verifyOtp(otp, referrerUsername);
      Cookies.remove('referrer');
      toast({ title: 'Pendaftaran Berhasil!', description: 'Anda akan diarahkan ke halaman profil Anda.' });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'OTP tidak valid. Silakan coba lagi.' });
      logError({
        message: err.message,
        stack: err.stack,
        context: 'register-otp-verify',
        userPhone: phone,
        path: pathname,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsSubmitting(true);
    setCountdown(60);
    const phoneNumber = normalizePhoneNumber(phone);

    try {
      await signInWithPhone(phoneNumber);
      toast({ title: 'OTP Terkirim Kembali', description: 'Silakan periksa kembali ponsel Anda.' });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Gagal Mengirim Ulang OTP', description: 'Silakan coba lagi beberapa saat.' });
      logError({
        message: err.message,
        stack: err.stack,
        context: 'register-otp-resend',
        userPhone: phoneNumber,
        path: pathname,
      });
      setCountdown(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isRegistrationOpen === null || user) {
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
                <ShieldOff className="w-16 h-16 text-muted-foreground my-4" />
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
        ) : (
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
                {referrerUsername && step === 'phone' && (
                  <div className="mb-4 text-center text-sm p-2 bg-primary/10 text-primary rounded-md">
                    Anda diundang oleh <span className="font-bold">{referrerUsername}</span>
                  </div>
                )}
                {step === 'phone' ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor Telepon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="cth: 08123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting || countdown > 0}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isSubmitting ? 'Mengirim...' : countdown > 0 ? `Kirim Ulang OTP dalam ${countdown}s` : 'Daftar'}
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
                    <Button type="button" variant="link" className="w-full" onClick={handleResendOtp} disabled={countdown > 0 || isSubmitting}>
                      {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim ulang kode OTP'}
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
        )}
      </div>
    </div>
  );
}
