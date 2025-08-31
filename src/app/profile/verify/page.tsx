
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, ArrowLeft, User, Fingerprint, CheckCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { readKtp } from '@/ai/flows/ocr-ktp-flow';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageCropper from '@/components/profile/ImageCropper';
import Image from 'next/image';

type Step = 'data' | 'ktp' | 'selfie' | 'confirm' | 'submitting';

export default function VerifyProfilePage() {
  const { user, submitForVerification } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('data');
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [ktpDataUrl, setKtpDataUrl] = useState<string | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'environment' | 'user'>('environment');

  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  useEffect(() => {
    if (user?.verificationStatus === 'permanent' || user?.verificationStatus === 'temporary') {
      router.replace('/profile');
    }
  }, [user, router]);
  
  useEffect(() => {
    // Clean up camera stream when component unmounts or step changes
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    async function switchCameraForStep() {
      if (step === 'ktp') {
        await startCamera('environment');
      } else if (step === 'selfie') {
        await startCamera('user');
      } else {
        stopCamera();
      }
    }
    switchCameraForStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);


  const startCamera = async (facingMode: 'environment' | 'user') => {
    stopCamera(); // Ensure previous stream is stopped
    setCurrentFacingMode(facingMode);
    setIsCameraActive(false); // Set loading state for camera

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ variant: 'destructive', title: 'Kamera tidak didukung' });
      setHasCameraPermission(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // videoRef.current.play() is required for some browsers.
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
    setStep('ktp');
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
      setStep('selfie');
    }
  };

  const handleCaptureSelfie = () => {
    const dataUrl = capturePhoto();
    if (dataUrl) {
      setSelfieDataUrl(dataUrl);
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
    if (!ktpDataUrl || !selfieDataUrl || !fullName || !nik) {
      toast({ variant: 'destructive', title: 'Data Tidak Lengkap' });
      setStep('data'); // Go back to the first step
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
        selfieFile: dataURLtoFile(selfieDataUrl, 'selfie.jpg'),
        ...(photoFile && { photoFile: photoFile }),
      };

      await submitForVerification(verificationData);
      
      toast({
        title: 'Verifikasi Berhasil!',
        description: 'Anda kini menjadi Anggota Sementara. Selamat datang di Garda Lestari!',
        duration: 5000,
      });
      router.push('/feed');

    } catch (error) {
      console.error(error);
      const errorMessage = (error as Error).message || 'Terjadi kesalahan. Silakan coba lagi.';
      toast({
        variant: 'destructive',
        title: 'Verifikasi Gagal',
        description: errorMessage,
        duration: 8000,
      });
      setStep('data'); // Reset to data step
      setKtpDataUrl(null);
      setSelfieDataUrl(null);
    }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

  const renderStep = () => {
    switch (step) {
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
              <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handlePhotoInputChange}
                accept="image/png, image/jpeg"
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
              Lanjutkan ke Ambil Foto
            </Button>
          </form>
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
      case 'selfie':
        return (
          <div className="space-y-4 text-center">
             <p className="text-muted-foreground">Posisikan wajah Anda di dalam bingkai, pastikan pencahayaan cukup.</p>
             {renderCameraView()}
             <Button size="lg" className="w-full" onClick={handleCaptureSelfie} disabled={!isCameraActive}>
                <Camera className="mr-2 h-4 w-4" /> Ambil Foto Selfie
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
                        <div className="space-y-2">
                            <Label>Foto Selfie</Label>
                            {selfieDataUrl && <Image src={selfieDataUrl} alt="Preview Selfie" width={120} height={75} className="rounded-md border object-cover"/>}
                        </div>
                    </div>
                </div>
                 <Button size="lg" className="w-full" onClick={handleSubmit}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Kirim Verifikasi
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
        <div className="w-full max-w-xs mx-auto aspect-square border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/50">
            <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraActive && "hidden", currentFacingMode === 'user' && 'transform -scale-x-100')} autoPlay muted playsInline />
            {!isCameraActive && hasCameraPermission !== false && <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />}
            {hasCameraPermission === false && <Camera className="h-16 w-16 text-muted-foreground" />}
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </>
  );

  const handleBack = () => {
    switch (step) {
      case 'ktp':
        setStep('data');
        break;
      case 'selfie':
        setStep('ktp');
        break;
      case 'confirm':
        setStep('selfie');
        break;
      default:
        router.back();
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'data': return "Langkah 1: Isi data diri dan unggah foto profil.";
      case 'ktp': return "Langkah 2: Ambil Foto KTP Anda.";
      case 'selfie': return "Langkah 3: Ambil Foto Selfie Anda.";
      case 'confirm': return "Langkah 4: Konfirmasi data Anda sebelum mengirim.";
      case 'submitting': return "Sedang memproses pengajuan Anda.";
      default: return "Verifikasi Identitas";
    }
  };

  return (
    <MainLayout>
       {cropperSrc && (
        <ImageCropper
          src={cropperSrc}
          onCropComplete={onCropComplete}
          onClose={() => setCropperSrc(null)}
        />
      )}
      <div className="p-6 space-y-6">
        {step !== 'submitting' && (
          <Button variant="outline" onClick={handleBack} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Identitas</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
