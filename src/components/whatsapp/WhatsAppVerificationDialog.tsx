
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
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
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [waNumber, setWaNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth(); // Assuming useAuth exposes a refresh function

  useEffect(() => {
    // This should only run once when the component mounts and user data is available.
    if (user && !user.waVerified) {
      setIsOpen(true);
      if (user.phoneNumber) {
        setWaNumber(user.phoneNumber.replace(/^\+/, ''));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid, user.waVerified]);


  const handleSendOtp = async () => {
    if (!waNumber.trim()) {
      toast({ variant: 'destructive', title: 'Nomor tidak boleh kosong' });
      return;
    }
    setLoading(true);
    try {
      const formattedNumber = waNumber.startsWith('0') ? `62${waNumber.substring(1)}` : waNumber;
      await saveWaNumber(user.uid, formattedNumber);
      toast({ title: 'Kode OTP terkirim!', description: 'Periksa WhatsApp Anda.' });
      setStep('otp');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mengirim OTP', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({ variant: 'destructive', title: 'OTP tidak boleh kosong' });
      return;
    }
    setLoading(true);
    try {
      const success = await verifyWaNumber(user.uid, otp);
      if (success) {
        toast({ title: 'Verifikasi Berhasil!', description: 'Nomor WhatsApp Anda telah diverifikasi.' });
        await refreshUser();
        setIsOpen(false);
      } else {
        throw new Error('Kode OTP yang Anda masukkan salah.');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Verifikasi Gagal', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevent closing the dialog with click outside or escape key
        if (!open) return;
        setIsOpen(open);
    }}>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>Verifikasi Nomor WhatsApp</DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? 'Untuk menerima notifikasi, mohon verifikasi nomor WhatsApp Anda. Pastikan nomor ini dapat menerima pesan.'
              : 'Masukkan 6 digit kode OTP yang kami kirimkan ke nomor WhatsApp Anda.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {step === 'input' ? (
            <div className="space-y-2">
              <Label htmlFor="waNumber">Nomor WhatsApp</Label>
              <Input
                id="waNumber"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="cth: 6281234567890"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">Kode OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="xxxxxx"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          {step === 'input' ? (
             <Button onClick={handleSendOtp} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Kode OTP
            </Button>
          ) : (
            <Button onClick={handleVerifyOtp} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verifikasi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
