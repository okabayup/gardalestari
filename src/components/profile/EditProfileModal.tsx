
'use client';

import { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User & { fullName?: string; nik?: string; username?: string };
}

export default function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const { updateUserProfile } = useAuth();
  const { toast } = useToast();
  // Name is locked, so we don't need a state for it.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoURL);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Only photo can be updated here
      if (photoFile) {
        await updateUserProfile({
          photoFile: photoFile || undefined,
        });
        toast({
          title: 'Profil Diperbarui',
          description: 'Foto profil Anda telah berhasil disimpan.',
        });
        onClose();
      } else {
         toast({
          variant: 'destructive',
          title: 'Tidak ada perubahan',
          description: 'Anda tidak memilih foto baru untuk disimpan.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Profil',
        description: 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
         {cropperSrc && (
            <ImageCropper
              src={cropperSrc}
              onCropComplete={onCropComplete}
              onClose={() => setCropperSrc(null)}
            />
          )}
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Anda hanya dapat mengubah foto profil. Nama dan NIK tidak dapat diubah setelah terverifikasi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoPreview || ''} alt={user.displayName || ''} />
              <AvatarFallback className="text-3xl text-primary">{getInitials(user.displayName || undefined)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Ubah Foto
            </Button>
            <Input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handlePhotoChange}
              accept="image/png, image/jpeg"
            />
          </div>
          <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Informasi Akun</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 text-sm">
                    <div>
                        <p className="font-semibold">Nama Pengguna</p>
                        <p className="text-muted-foreground">@{user.username || 'Belum diatur'}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Nama Lengkap</p>
                        <p className="text-muted-foreground">{user.displayName || 'Belum diatur'}</p>
                    </div>
                    <div>
                        <p className="font-semibold">NIK</p>
                        <p className="text-muted-foreground">{user.nik || 'Belum diatur'}</p>
                    </div>
                </div>
              </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || !photoFile}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
