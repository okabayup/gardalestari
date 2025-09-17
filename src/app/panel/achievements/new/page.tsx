
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, User, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { createAchievement } from '@/app/actions/achievements';
import { searchUsers, PublicUser } from '@/app/actions/user';
import { cn } from '@/lib/utils';
import { useDebounce } from 'use-debounce';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

const formSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
  }, { required_error: "Anggota wajib dipilih" }),
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  imageFile: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

const UserSearch = ({ onSelectUser }: { onSelectUser: (user: PublicUser) => void }) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 300);
    const [results, setResults] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            if (debouncedSearch.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            const users = await searchUsers(debouncedSearch, 5);
            setResults(users);
            setLoading(false);
        };
        fetchUsers();
    }, [debouncedSearch]);
    
    const handleSelect = (user: PublicUser) => {
        onSelectUser(user);
        setSearch('');
        setResults([]);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                 <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Search className="mr-2 h-4 w-4" />
                    Cari Anggota...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                 <Input 
                    placeholder="Cari nama atau username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 focus-visible:ring-0"
                />
                <div className="p-2 space-y-1">
                    {loading && <div className="text-center p-2"><Loader2 className="h-4 w-4 animate-spin mx-auto"/></div>}
                    {results.map(user => (
                        <div key={user.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handleSelect(user)}>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default function NewAchievementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const selectedUser = watch("user");
  const imageFile = watch("imageFile");
  
  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
        const url = URL.createObjectURL(imageFile[0]);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { imageFile, user, ...achievementData } = data;
      const payload = {
        ...achievementData,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        date: Timestamp.fromDate(data.date),
      };
      await createAchievement(payload, imageFile?.[0]);
      toast({ title: 'Prestasi berhasil ditambahkan!' });
      router.push('/panel/achievements');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan', description: (error as Error).message });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-headline text-2xl font-bold">Tambah Prestasi Baru</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/panel/achievements')}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Prestasi
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detail Prestasi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Anggota</Label>
            {selectedUser ? (
                <div className="flex items-center gap-2 p-2 rounded-md border">
                    <Avatar className="h-8 w-8"><AvatarImage src={selectedUser.avatarUrl} /><AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="font-medium">{selectedUser.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setValue('user', undefined as any)}>Ganti</Button>
                </div>
            ) : (
                <UserSearch onSelectUser={(user) => setValue('user', {id: user.id, name: user.fullName, avatarUrl: user.avatarUrl})} />
            )}
            {errors.user && <p className="text-sm text-destructive">{errors.user.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul Prestasi</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Tanggal Prestasi</Label>
                <Controller
                name="date"
                control={control}
                render={({ field }) => (
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                    </Popover>
                )}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="imageFile">Gambar Bukti (Opsional)</Label>
                <Input id="imageFile" type="file" {...register('imageFile')} accept="image/*" />
                {imagePreview && <Image src={imagePreview} alt="Pratinjau bukti" width={100} height={100} className="mt-2 rounded-md object-cover" />}
                <p className="text-xs text-muted-foreground">Ukuran file maksimal: 5MB. Jika gagal, coba gunakan format JPG &lt; 1MB.</p>
            </div>
          </div>

        </CardContent>
      </Card>
    </form>
  );
}
