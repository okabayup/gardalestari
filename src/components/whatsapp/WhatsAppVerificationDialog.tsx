
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { saveWaNumber, verifyWaNumber } from '@/app/actions/user';

interface WhatsAppVerificationDialogProps {
  user: {
    uid: string;
    waVerified?: boolean;
    phoneNumber?: string | null;
  };
}

export default function WhatsAppVerificationDialog({ user }: WhatsAppVerificationDialogProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [waNumber, setWaNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  useEffect(() => {
     if (user.phoneNumber) {
        setWaNumber(user.phoneNumber.replace(/^\+/, ''));
     }
  }, [user.phoneNumber]);


  const handleSendOtp = async () => {
    if (!waNumber.trim()) {
      toast({ variant: 'destructive', title: 'Nomor tidak boleh kosong' });
      return;
    }
    setLoadingSend(true);
    try {
      const formattedNumber = waNumber.startsWith('0') ? `62${waNumber.substring(1)}` : waNumber;
      const result = await saveWaNumber(user.uid, formattedNumber);
      
      if (result.success) {
        toast({ title: 'Kode OTP terkirim!', description: 'Periksa WhatsApp Anda.' });
        setOtpSent(true);
      } else {
        // Display toast directly instead of throwing an error
        toast({
          variant: 'destructive',
          title: 'Gagal mengirim OTP',
          description: result.error || 'Terjadi kesalahan di server.'
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({ variant: 'destructive', title: 'Gagal mengirim OTP', description: (error as Error).message });
    } finally {
      setLoadingSend(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      toast({ variant: 'destructive', title: 'Kode OTP harus 6 digit' });
      return;
    }
    setLoadingVerify(true);
    try {
      const success = await verifyWaNumber(user.uid, otp);
      if (success) {
        toast({ title: 'Verifikasi Berhasil!', description: 'Nomor WhatsApp Anda telah diverifikasi.' });
        await refreshUser();
      } else {
        throw new Error('Kode OTP yang Anda masukkan salah.');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Verifikasi Gagal', description: (error as Error).message });
    } finally {
      setLoadingVerify(false);
    }
  };


  return (
    <Dialog open={true}>
      <DialogContent hideClose={true} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Verifikasi Nomor WhatsApp</DialogTitle>
          <DialogDescription>
            Untuk melanjutkan, mohon verifikasi nomor WhatsApp Anda untuk menerima notifikasi penting seperti status dokumen dan pengumuman program.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waNumber">Nomor WhatsApp</Label>
              <div className="flex gap-2">
                <Input
                    id="waNumber"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="cth: 6281234567890"
                    disabled={otpSent || loadingSend}
                />
                 <Button onClick={handleSendOtp} disabled={otpSent || loadingSend}>
                    {loadingSend ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirim OTP'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Kode OTP</Label>
               <div className="flex gap-2">
                <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder="xxxxxx"
                    disabled={!otpSent || loadingVerify}
                />
                 <Button onClick={handleVerifyOtp} disabled={!otpSent || loadingVerify}>
                    {loadingVerify ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verifikasi'}
                </Button>
               </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
