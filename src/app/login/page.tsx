
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, loading, signInWithPhone, verifyOtp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
    try {
      // Firebase requires phone number in E.164 format (e.g., +6281234567890)
      const phoneNumber = phone.startsWith('+') ? phone : `+62${phone.replace(/^0/, '')}`;
      await signInWithPhone(phoneNumber, 'recaptcha-container');
      setStep('otp');
      toast({ title: 'OTP Terkirim', description: 'Silakan periksa ponsel Anda untuk kode verifikasi.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim OTP. Pastikan nomor valid dan coba lagi.' });
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
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'OTP tidak valid. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsSubmitting(true);
    setCountdown(60);
    try {
      const phoneNumber = phone.startsWith('+') ? phone : `+62${phone.replace(/^0/, '')}`;
      await signInWithPhone(phoneNumber, 'recaptcha-container');
      toast({ title: 'OTP Terkirim Kembali', description: 'Silakan periksa kembali ponsel Anda.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal Mengirim Ulang OTP', description: 'Silakan coba lagi beberapa saat.' });
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
       <div id="recaptcha-container"></div>
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

    