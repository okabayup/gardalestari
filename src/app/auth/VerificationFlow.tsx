
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, User, Fingerprint, CheckCircle, MessageSquare } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { readKtp } from '@/ai/flows/ocr-ktp-flow';
import { saveWaNumber, verifyWaNumber } from '@/app/actions/user';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageCropper from '@/components/profile/ImageCropper';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

type Step = 'welcome' | 'data' | 'whatsapp' | 'ktp' | 'confirm' | 'submitting';

const STEPS_COUNT = 4;

export default function VerificationFlow() {
  const { user, submitForVerification, refreshUser, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('welcome');
  const [progress, setProgress] = useState(0);
  
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [waNumber, setWaNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [ktpDataUrl, setKtpDataUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  useEffect(() => {
    if (user?.phoneNumber) {
        const rawNumber = user.phoneNumber.replace(/\D/g, '');
        setWaNumber(rawNumber.startsWith('62') ? rawNumber : `62${rawNumber}`);
     }
  }, [user?.phoneNumber]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    async function switchCameraForStep() {
      if (step === 'ktp') {
        await startCamera('environment');
        setProgress((3 / STEPS_COUNT) * 100);
      } else {
        stopCamera();
      }
    }
    switchCameraForStep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  
  useEffect(() => {
    switch (step) {
      case 'welcome': setProgress(0); break;
      case 'data': setProgress((1 / STEPS_COUNT) * 100); break;
      case 'whatsapp': setProgress((2 / STEPS_COUNT) * 100); break;
      case 'confirm': setProgress((4 / STEPS_COUNT) * 100); break;
      case 'submitting': setProgress(100); break;
    }
  }, [step]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);


  const startCamera = async (facingMode: 'environment' | 'user') => {
    stopCamera(); 
    setIsCameraActive(false); 

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ variant: 'destructive', title: 'Kamera tidak didukung' });
      setHasCameraPermission(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Akses Kamera Ditolak',
        description: 'Mohon izinkan akses kamera di browser Anda untuk melanjutkan.',
      });
    }
  };


  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handlePhotoInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB
          toast({ variant: 'destructive', title: 'Ukuran file terlalu besar', description: 'Maksimal ukuran file adalah 5MB.' });
          return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCropperSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedFile: File) => {
    setPhotoFile(croppedFile);
    setPhotoPreview(URL.createObjectURL(croppedFile));
    setCropperSrc(null);
  };

  const handleDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nik || nik.length !== 16) {
      toast({ variant: 'destructive', title: 'Data tidak valid', description: 'Mohon isi NIK (16 digit) dan nama lengkap.' });
      return;
    }
    setStep('whatsapp');
  };

  const handleSendOtp = async () => {
    if (!waNumber.trim() || !user || countdown > 0) {
      if (countdown > 0) toast({ variant: 'destructive', title: 'Mohon tunggu sebentar' });
      return;
    }
    setLoadingSendOtp(true);
    setCountdown(60);
    try {
      const result = await saveWaNumber(user.uid, waNumber);
      if (result.success) {
         toast({ title: 'Kode OTP terkirim!', description: 'Periksa WhatsApp Anda.' });
         setOtpSent(true);
      } else {
        throw new Error(result.error || 'Gagal mengirim pesan.');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Terjadi kesalahan pada sisi klien.';
      console.error("Error from handleSendOtp:", error);
      toast({ variant: 'destructive', title: 'Gagal mengirim OTP', description: errorMessage, duration: 7000 });
      setCountdown(0);
    } finally {
      setLoadingSendOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6 || !user) {
      toast({ variant: 'destructive', title: 'Kode OTP harus 6 digit' });
      return;
    }
    setLoadingVerifyOtp(true);
    try {
      const success = await verifyWaNumber(user.uid, otp);
      if (success) {
        toast({ title: 'Verifikasi Berhasil!', description: 'Nomor WhatsApp Anda telah diverifikasi.' });
        await refreshUser();
        setStep('ktp');
      } else {
        throw new Error('Kode OTP yang Anda masukkan salah.');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Verifikasi Gagal', description: (error as Error).message });
    } finally {
      setLoadingVerifyOtp(false);
    }
  };


  const capturePhoto = (): string | null => {
    if (videoRef.current && canvasRef.current && isCameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  };

  const handleCaptureKtp = () => {
    const dataUrl = capturePhoto();
    if (dataUrl) {
      setKtpDataUrl(dataUrl);
      setStep('confirm');
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleSubmit = async () => {
    if (!ktpDataUrl || !fullName || !nik) {
      toast({ variant: 'destructive', title: 'Data Tidak Lengkap' });
      setStep('data'); 
      return;
    }
    setStep('submitting');

    try {
      toast({ title: 'Memproses KTP...', description: 'Mohon tunggu, sedang memverifikasi data KTP Anda dengan OCR.' });
      const ocrResult = await readKtp({ photoDataUri: ktpDataUrl });

      if (!ocrResult || !ocrResult.nik || !ocrResult.name) {
          throw new Error('Gagal membaca KTP. Pastikan foto jelas dan tidak buram.');
      }
      
      const normalizedOcrNik = ocrResult.nik.replace(/\D/g, '');
      const normalizedInputNik = nik.replace(/\D/g, '');
      const normalizedOcrName = ocrResult.name.trim().toLowerCase();
      const normalizedInputName = fullName.trim().toLowerCase();

      if (normalizedOcrNik !== normalizedInputNik || !normalizedOcrName.includes(normalizedInputName)) {
          let errorMessage = 'Data tidak cocok. ';
          if (normalizedOcrNik !== normalizedInputNik) {
              errorMessage += `NIK di KTP terdeteksi sebagai ${ocrResult.nik}. `;
          }
          if (!normalizedOcrName.includes(normalizedInputName)) {
              errorMessage += `Nama di KTP terdeteksi sebagai "${ocrResult.name}".`;
          }
          throw new Error(errorMessage);
      }


      toast({ title: 'KTP Terverifikasi!', description: 'Data cocok. Mengirimkan pengajuan Anda...' });

      const verificationData = {
        fullName,
        nik,
        ktpFile: dataURLtoFile(ktpDataUrl, 'ktp.jpg'),
        ...(photoFile && { photoFile: photoFile }),
        waNumber: waNumber,
      };

      await submitForVerification(verificationData);
      
      toast({
        title: 'Pengajuan Terkirim!',
        description: 'Pengajuan verifikasi Anda telah berhasil dikirim. Tim kami akan segera meninjaunya.',
        duration: 8000,
      });
      // The user state will be updated by the auth provider, and MainLayout will re-render to show the app.
    } catch (error) {
      console.error(error);
      const errorMessage = (error as Error).message || 'Terjadi kesalahan. Silakan coba lagi.';
      toast({
        variant: 'destructive',
        title: 'Verifikasi Gagal',
        description: errorMessage,
        duration: 8000,
      });
      setStep('data'); 
      setKtpDataUrl(null);
    }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

  const renderContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold font-headline">Selamat Datang di Garda Lestari!</h2>
              <p className="text-muted-foreground">Sebelum melanjutkan, Anda perlu menyelesaikan verifikasi keanggotaan. Proses ini cepat dan hanya membutuhkan beberapa langkah untuk memastikan keamanan komunitas kita.</p>
              <p className="text-muted-foreground">Siapkan KTP Anda untuk memulai.</p>
              <Button size="lg" className="w-full" onClick={() => setStep('data')}>Mulai Verifikasi</Button>
          </div>
        );
      case 'data':
        return (
          <form onSubmit={handleDataSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreview || undefined} alt={fullName || 'Avatar'} />
                <AvatarFallback className="text-3xl text-primary">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Pilih Foto Profil
              </Button>
               <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
              <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handlePhotoInputChange}
                accept="image/*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">Nomor Induk Kependudukan (NIK)</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="nik" value={nik} onChange={e => setNik(e.target.value.replace(/\D/g, ''))} placeholder="16 digit NIK pada KTP Anda" maxLength={16} required className="pl-9" />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap (sesuai KTP)</Label>
               <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nama lengkap sesuai KTP" required className="pl-9" />
               </div>
            </div>
            <Button size="lg" className="w-full" type="submit">
              Lanjutkan
            </Button>
          </form>
        );
      case 'whatsapp':
        return (
             <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="waNumber">Nomor WhatsApp</Label>
                <div className="flex gap-2">
                    <Input
                        id="waNumber"
                        value={waNumber}
                        onChange={(e) => setWaNumber(e.target.value)}
                        placeholder="cth: 6281234567890"
                        disabled={otpSent || loadingSendOtp || countdown > 0}
                    />
                    <Button onClick={handleSendOtp} disabled={loadingSendOtp || countdown > 0}>
                        {loadingSendOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : (countdown > 0 ? `${countdown}s` : 'Kirim OTP')}
                    </Button>
                </div>
                </div>
                {otpSent && (
                    <div className="space-y-2">
                    <Label htmlFor="otp">Kode OTP</Label>
                    <div className="flex gap-2">
                        <Input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            placeholder="xxxxxx"
                            disabled={loadingVerifyOtp}
                        />
                        <Button onClick={handleVerifyOtp} disabled={loadingVerifyOtp}>
                            {loadingVerifyOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verifikasi'}
                        </Button>
                    </div>
                     <Button type="button" variant="link" size="sm" className="w-full" onClick={handleSendOtp} disabled={countdown > 0 || loadingSendOtp}>
                        {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim ulang kode OTP'}
                    </Button>
                    </div>
                )}
            </div>
        );
      case 'ktp':
        return (
          <div className="space-y-4 text-center">
             <p className="text-muted-foreground">Posisikan KTP Anda di dalam bingkai dan pastikan semua tulisan terbaca jelas.</p>
             {renderCameraView()}
             <Button size="lg" className="w-full" onClick={handleCaptureKtp} disabled={!isCameraActive}>
                <Camera className="mr-2 h-4 w-4" /> Ambil Foto KTP
             </Button>
          </div>
        );
      case 'confirm':
        return (
            <div className="space-y-6">
                 <div className="space-y-4">
                    <h3 className="font-semibold">Mohon konfirmasi data Anda:</h3>
                    <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                        <div className="space-y-2">
                            <Label>Nama & NIK</Label>
                            <p className="text-sm font-medium">{fullName}</p>
                            <p className="text-sm font-mono text-muted-foreground">{nik}</p>
                        </div>
                         <div className="space-y-2">
                            <Label>No. WhatsApp</Label>
                            <p className="text-sm font-mono">{waNumber}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Foto Profil</Label>
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={photoPreview || undefined} />
                                <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-2">
                            <Label>Foto KTP</Label>
                             {ktpDataUrl && <Image src={ktpDataUrl} alt="Preview KTP" width={120} height={75} className="rounded-md border object-cover"/>}
                        </div>
                    </div>
                </div>
                 <Button size="lg" className="w-full" onClick={handleSubmit}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Kirim Pengajuan Verifikasi
                 </Button>
            </div>
        );
      case 'submitting':
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-10">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Memverifikasi dan mengirimkan data...</p>
            </div>
        )
    }
  };
  
  const renderCameraView = () => (
      <>
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Akses Kamera Diperlukan</AlertTitle>
                <AlertDescription>
                    Aplikasi ini memerlukan akses ke kamera Anda. Mohon segarkan halaman dan izinkan akses kamera.
                </AlertDescription>
            </Alert>
        )}
        <div className="w-full max-w-xs mx-auto aspect-video border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/50">
            <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraActive && "hidden")} autoPlay muted playsInline />
            {!isCameraActive && hasCameraPermission !== false && <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />}
            {hasCameraPermission === false && <Camera className="h-16 w-16 text-muted-foreground" />}
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </>
  );

  const getStepDescription = () => {
    switch (step) {
      case 'welcome': return "Selamat datang di proses verifikasi keanggotaan.";
      case 'data': return "Langkah 1 dari 4: Isi data diri Anda.";
      case 'whatsapp': return "Langkah 2 dari 4: Verifikasi nomor WhatsApp.";
      case 'ktp': return "Langkah 3 dari 4: Ambil Foto KTP.";
      case 'confirm': return "Langkah 4 dari 4: Konfirmasi data Anda.";
      case 'submitting': return "Sedang memproses pengajuan Anda.";
      default: return "Verifikasi Identitas";
    }
  };

  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
          {cropperSrc && (
            <ImageCropper
              src={cropperSrc}
              onCropComplete={onCropComplete}
              onClose={() => setCropperSrc(null)}
            />
          )}
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
                <Image src="/logo.png" alt="Garda Lestari Logo" width={160} height={42} className="h-auto w-40 mx-auto" />
            </div>
            <Card>
              <CardHeader>
                  <Progress value={progress} className="h-2 mb-4" />
                  <CardTitle>{step === 'welcome' ? 'Verifikasi Keanggotaan' : `Langkah ${Math.floor(progress / (100 / STEPS_COUNT))}`}</CardTitle>
                  <CardDescription>{getStepDescription()}</CardDescription>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
            <Button variant="link" size="sm" className="mt-4 text-muted-foreground" onClick={signOut}>Keluar</Button>
          </div>
      </div>
  );
}
