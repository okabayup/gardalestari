

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus } from 'lucide-react';
import { createManualMember } from '@/app/actions/members';
import type { MemberType } from '@/lib/definitions';
import { getPositions, Position } from '@/app/actions/positions';
import Image from 'next/image';

const formSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  titlePrefix: z.string().optional(),
  titlePostfix: z.string().optional(),
  positionId: z.string({ required_error: "Jabatan wajib dipilih" }).min(1, "Jabatan wajib dipilih"),
  type: z.enum(['pusat', 'daerah', 'cabang', 'pembina', 'pengawas', 'penasehat'], { required_error: "Tipe keanggotaan wajib dipilih" }),
  region: z.string().optional(),
  isSpecialMember: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  photoFile: z.any().optional(),
}).refine(data => data.type !== 'daerah' || !!data.region, {
  message: "Wilayah harus diisi untuk anggota DPD",
  path: ["region"],
});

type FormData = z.infer<typeof formSchema>;

const memberTypes: { value: MemberType, label: string }[] = [
  { value: 'pusat', label: 'DPP' },
  { value: 'daerah', label: 'DPD' },
  { value: 'cabang', label: 'DPC' },
  { value: 'pembina', label: 'Dewan Pembina' },
  { value: 'pengawas', label: 'Dewan Pengawas' },
  { value: 'penasehat', label: 'Dewan Penasehat' },
];

export default function NewManualMemberPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ 
    resolver: zodResolver(formSchema),
    defaultValues: {
      isSpecialMember: false,
      isHidden: false,
    }
  });
  
  const photoFileList = watch('photoFile');
  const memberType = watch('type');

  useEffect(() => {
    getPositions().then(setPositions);
  }, []);
  
  useEffect(() => {
    if (photoFileList && photoFileList.length > 0) {
      const file = photoFileList[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB
          toast({ variant: 'destructive', title: 'Ukuran file terlalu besar', description: 'Maksimal ukuran file adalah 5MB.' });
          return;
      }
      setPhotoPreview(URL.createObjectURL(file));
    } else {
        setPhotoPreview(null);
    }
  }, [photoFileList, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'photoFile' && value instanceof FileList && value.length > 0) {
        formData.append(key, value[0]);
      } else if (typeof value === 'boolean') {
        formData.append(key, String(value));
      } else if (value) {
        formData.append(key, value as string);
      }
    });

    try {
      await createManualMember(formData);
      toast({ title: 'Anggota manual berhasil ditambahkan!' });
      router.push('/panel/members');
    } catch (error) {
      console.error("[onSubmit Error]", error);
      toast({ variant: 'destructive', title: 'Gagal menambahkan anggota', description: (error as Error).message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Tambah Anggota Manual</h1>
          <p className="text-muted-foreground">Untuk anggota kehormatan yang tidak memiliki akun.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/members')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-2 h-4 w-4" />
            Simpan Anggota
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Anggota</CardTitle>
          <CardDescription>Isi informasi dasar untuk anggota baru.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="titlePrefix">Gelar Depan</Label>
                <Input id="titlePrefix" {...register('titlePrefix')} placeholder="Prof. Dr."/>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input id="fullName" {...register('fullName')} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
               <div className="space-y-2 md:col-span-1">
                <Label htmlFor="titlePostfix">Gelar Belakang</Label>
                <Input id="titlePostfix" {...register('titlePostfix')} placeholder="S.T., M.Kom."/>
              </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Controller name="positionId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih jabatan..." /></SelectTrigger>
                        <SelectContent>
                            {positions.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )} />
                {errors.positionId && <p className="text-sm text-destructive">{errors.positionId.message}</p>}
              </div>
               <div className="space-y-2">
                <Label>Tipe Keanggotaan</Label>
                <Controller name="type" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih tipe..." /></SelectTrigger>
                        <SelectContent>
                            {memberTypes.map(mt => <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )} />
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
          </div>
          
           {memberType === 'daerah' && (
             <div className="space-y-2">
                <Label htmlFor="region">Wilayah/Daerah</Label>
                <Input id="region" {...register('region')} placeholder="Contoh: Jawa Barat" />
                {errors.region && <p className="text-sm text-destructive">{errors.region.message}</p>}
            </div>
           )}

           <div className="space-y-2">
                <Label htmlFor="photoFile">Foto Profil</Label>
                <Input id="photoFile" type="file" accept="image/*" {...register('photoFile')} />
                {photoPreview && <Image src={photoPreview} alt="Pratinjau foto" width={100} height={100} className="mt-2 rounded-full object-cover" />}
                <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
            </div>

           <div className="flex items-center space-x-2 pt-2">
              <Controller name="isSpecialMember" control={control} render={({ field }) => (
                  <Switch id="isSpecialMember" checked={field.value} onCheckedChange={field.onChange} />
              )}/>
              <Label htmlFor="isSpecialMember">Jadikan Anggota Istimewa (Hak Suara Khusus)</Label>
            </div>
             <div className="flex items-center space-x-2 pt-2">
              <Controller name="isHidden" control={control} render={({ field }) => (
                  <Switch id="isHidden" checked={field.value} onCheckedChange={field.onChange} />
              )}/>
              <Label htmlFor="isHidden">Sembunyikan dari Direktori Publik</Label>
            </div>
        </CardContent>
      </Card>
    </form>
  );
}
