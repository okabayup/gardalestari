
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { checkUsernameExists } from '@/app/actions/user';
import { useDebounce } from 'use-debounce';


interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User & { fullName?: string; nik?: string; username?: string };
}

export default function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const { updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(user.username || '');
  const [debouncedUsername] = useDebounce(username, 500);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoURL);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const canEditUsername = !user.username || user.username.startsWith('user_') || user.username.startsWith('anggota');

  useEffect(() => {
    const checkUsername = async () => {
      if (debouncedUsername && canEditUsername && debouncedUsername !== user.username) {
        setIsCheckingUsername(true);
        const exists = await checkUsernameExists(debouncedUsername);
        setIsUsernameAvailable(!exists);
        setIsCheckingUsername(false);
      } else {
        setIsUsernameAvailable(true);
      }
    };
    checkUsername();
  }, [debouncedUsername, user.username, canEditUsername]);


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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
  }

  const handleSubmit = async () => {
    if (canEditUsername && (!isUsernameAvailable || isCheckingUsername)) {
         toast({
          variant: 'destructive',
          title: 'Nama Pengguna Tidak Tersedia',
          description: 'Silakan pilih nama pengguna yang lain.',
        });
        return;
    }

    setLoading(true);
    try {
      const updates: { photoFile?: File; username?: string } = {};
      let hasChanges = false;

      if (photoFile) {
        updates.photoFile = photoFile;
        hasChanges = true;
      }
      if (canEditUsername && username && username !== user.username) {
        updates.username = username;
        hasChanges = true;
      }

      if (hasChanges) {
        await updateUserProfile(updates);
        toast({
          title: 'Profil Diperbarui',
          description: 'Perubahan pada profil Anda telah berhasil disimpan.',
        });
        onClose();
      } else {
         toast({
          variant: 'destructive',
          title: 'Tidak ada perubahan',
          description: 'Anda tidak membuat perubahan untuk disimpan.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Profil',
        description: (error as Error).message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasMadeChanges = (photoFile !== null) || (canEditUsername && username !== user.username);


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
            Perbarui foto profil atau nama pengguna Anda. Nama lengkap dan NIK tidak dapat diubah.
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
          
          {canEditUsername && (
             <div className="space-y-2">
                <Label htmlFor="username">Nama Pengguna</Label>
                <Input 
                    id="username"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="pilih_nama_pengguna_unik"
                />
                <div className="text-xs text-muted-foreground h-4 px-1">
                    {isCheckingUsername ? "Memeriksa ketersediaan..." : (
                        debouncedUsername && (isUsernameAvailable ? 
                            <span className="text-green-600">Tersedia!</span> : 
                            <span className="text-destructive">Sudah digunakan.</span>
                        )
                    )}
                </div>
            </div>
          )}


          <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Informasi Akun</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 text-sm">
                    {!canEditUsername && (
                        <div>
                            <p className="font-semibold">Nama Pengguna</p>
                            <p className="text-muted-foreground">@{user.username || 'Belum diatur'}</p>
                        </div>
                    )}
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
          <Button onClick={handleSubmit} disabled={loading || !hasMadeChanges || !isUsernameAvailable || isCheckingUsername}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
