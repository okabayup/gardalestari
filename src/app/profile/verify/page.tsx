
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Upload, ArrowLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function VerifyProfilePage() {
  const { user, submitForVerification } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    if (user?.verificationStatus === 'verified') {
        router.replace('/profile');
    }
    // Clean up camera stream on component unmount
    return () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    }
  }, [user, router]);


  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setKtpFile(file);
      setKtpPreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
    } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Akses Kamera Ditolak',
          description: 'Mohon izinkan akses kamera di browser Anda untuk mengambil selfie.',
        });
    }
  };

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      canvas.toBlob(blob => {
        if (blob) {
            setSelfieFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
            setSelfiePreview(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setIsCameraOn(false);
  }

  const handleSubmit = async () => {
    if (!ktpFile || !selfieFile) {
      toast({
        variant: 'destructive',
        title: 'Data Tidak Lengkap',
        description: 'Mohon unggah foto KTP dan ambil selfie.',
      });
      return;
    }

    setLoading(true);
    try {
      await submitForVerification({ ktpFile, selfieFile });
      toast({
        title: 'Verifikasi Terkirim!',
        description: 'Data Anda telah berhasil dikirim dan akan segera ditinjau oleh tim kami.',
      });
      router.push('/profile');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Verifikasi',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Profil
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Identitas</CardTitle>
            <CardDescription>Untuk keamanan dan penerbitan KTA, mohon lengkapi data berikut.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* KTP Upload */}
            <div className="space-y-2">
              <label className="font-medium">1. Unggah Foto KTP</label>
              <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                {ktpPreview ? (
                  <img src={ktpPreview} alt="Pratinjau KTP" className="object-contain max-h-full max-w-full" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="mx-auto h-8 w-8" />
                    <p>Klik untuk memilih file</p>
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full" onClick={() => ktpInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Pilih File KTP
              </Button>
              <input 
                type="file" 
                ref={ktpInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleKtpFileChange}
              />
            </div>

            {/* Selfie Capture */}
            <div className="space-y-2">
              <label className="font-medium">2. Ambil Selfie</label>
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                    <AlertTitle>Akses Kamera Diperlukan</AlertTitle>
                    <AlertDescription>
                        Mohon izinkan akses kamera pada browser Anda untuk melanjutkan.
                    </AlertDescription>
                </Alert>
              )}
              <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/50">
                 {selfiePreview ? (
                    <img src={selfiePreview} alt="Pratinjau Selfie" className="object-contain max-h-full max-w-full" />
                ) : isCameraOn ? (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="mx-auto h-8 w-8" />
                    <p>Nyalakan kamera untuk mengambil selfie</p>
                  </div>
                )}
                 <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
              {!isCameraOn && !selfiePreview && (
                <Button variant="outline" className="w-full" onClick={startCamera}>
                    <Camera className="mr-2 h-4 w-4" /> Nyalakan Kamera
                </Button>
              )}
              {isCameraOn && (
                 <Button className="w-full" onClick={takeSelfie}>
                    Ambil Foto Selfie
                </Button>
              )}
               {(selfiePreview) && (
                 <Button variant="outline" className="w-full" onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}>
                    Ambil Ulang Selfie
                </Button>
              )}
            </div>
            
            <Button size="lg" className="w-full" onClick={handleSubmit} disabled={loading || !ktpFile || !selfieFile}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim untuk Verifikasi
            </Button>

          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

