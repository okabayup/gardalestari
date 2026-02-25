
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/app/actions/errors';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Function to normalize phone number to +62 format
const normalizePhoneNumber = (phone: string): string => {
    let normalized = phone.replace(/\D/g, ''); // Remove non-digit characters
    if (normalized.startsWith('0')) {
        normalized = '62' + normalized.substring(1);
    } else if (normalized.startsWith('62')) {
        // Already in correct format prefix, do nothing
    } else {
        normalized = '62' + normalized;
    }
    return `+${normalized}`;
};


export default function LoginPage() {
  const { user, loading, signInWithPhone, verifyOtp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!loading && !user && recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
        try {
            const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                'size': 'invisible',
                'callback': () => {},
            });
            recaptchaVerifierRef.current = verifier;
        } catch (error) {
             console.error("reCAPTCHA initialization error:", error);
             toast({
                variant: 'destructive',
                title: 'Gagal memuat reCAPTCHA',
                description: 'Mohon segarkan halaman dan coba lagi.',
            });
        }
    }
  }, [loading, user, toast]);

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

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
    
    if (!recaptchaVerifierRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'reCAPTCHA belum siap. Mohon segarkan halaman.' });
        setIsSubmitting(false);
        setCountdown(0);
        return;
    }

    try {
      await signInWithPhone(phoneNumber, recaptchaVerifierRef.current);
      setStep('otp');
      toast({ title: 'OTP Terkirim', description: 'Silakan periksa ponsel Anda untuk kode verifikasi.' });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim OTP. Pastikan nomor valid dan coba lagi.' });
      logError({ 
        message: err.message, 
        stack: err.stack, 
        context: 'login-otp-send', 
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
      await verifyOtp(otp);
      toast({ title: 'Sukses', description: 'Anda berhasil masuk!' });
      router.push('/feed');
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'OTP tidak valid. Silakan coba lagi.' });
      logError({ 
        message: err.message, 
        stack: err.stack, 
        context: 'login-otp-verify', 
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
    
    if (!recaptchaVerifierRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'reCAPTCHA belum siap. Mohon tunggu atau segarkan halaman.' });
        setIsSubmitting(false);
        setCountdown(0);
        return;
    }

    try {
      await signInWithPhone(phoneNumber, recaptchaVerifierRef.current);
      toast({ title: 'OTP Terkirim Kembali', description: 'Silakan periksa kembali ponsel Anda.' });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Gagal Mengirim Ulang OTP', description: 'Silakan coba lagi beberapa saat.' });
      logError({ 
        message: err.message, 
        stack: err.stack, 
        context: 'login-otp-resend', 
        userPhone: phoneNumber,
        path: pathname,
      });
      setCountdown(0);
    } finally {
      setIsSubmitting(false);
    }
  }


  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
       <div ref={recaptchaContainerRef} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="Garda Lestari Logo" width={160} height={42} className="h-auto w-40" />
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Selamat Datang Kembali</CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'Masukkan nomor telepon Anda untuk masuk.'
                : 'Masukkan OTP yang dikirim ke ponsel Anda.'}
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
                <Button type="submit" className="w-full" disabled={isSubmitting || countdown > 0}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Mengirim...' : (countdown > 0 ? `Kirim Ulang OTP dalam ${countdown}s` : 'Kirim OTP')}
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
                  Verifikasi & Masuk
                </Button>
                 <Button type="button" variant="link" className="w-full" onClick={handleResendOtp} disabled={countdown > 0 || isSubmitting}>
                    {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim ulang kode OTP'}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Daftar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
