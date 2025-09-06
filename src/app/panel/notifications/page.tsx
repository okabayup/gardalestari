
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, X } from 'lucide-react';
import { sendNotification } from '@/app/actions/notifications';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDebounce } from 'use-debounce';
import { searchUsers, PublicUser } from '@/app/actions/user';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { MemberType } from '@/app/actions/members';


const memberTypes: { value: MemberType, label: string }[] = [
  { value: 'pusat', label: 'DPP' },
  { value: 'daerah', label: 'DPD' },
  { value: 'cabang', label: 'DPC' },
  { value: 'pembina', label: 'Dewan Pembina' },
  { value: 'pengawas', label: 'Dewan Pengawas' },
  { value: 'penasehat', label: 'Dewan Penasehat' },
];

const notificationSchema = z.object({
  title: z.string().min(3, 'Judul harus memiliki setidaknya 3 karakter'),
  message: z.string().min(5, 'Pesan harus memiliki setidaknya 5 karakter'),
  targetType: z.enum(['all', 'users', 'memberType']),
  userIds: z.array(z.string()).optional(),
  memberType: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const UserSearch = ({ onAddUser }: { onAddUser: (user: PublicUser) => void }) => {
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
        onAddUser(user);
        setSearch('');
        setResults([]);
    }

    return (
        <div className="relative">
            <Input 
                placeholder="Cari nama pengguna atau nama lengkap..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {(loading || results.length > 0) && (
                 <Card className="absolute z-10 w-full mt-1">
                    <CardContent className="p-2 max-h-60 overflow-y-auto">
                        {loading && <div className="text-center p-2"><Loader2 className="h-4 w-4 animate-spin mx-auto"/></div>}
                        <div className="space-y-1">
                        {results.map(user => (
                            <div key={user.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handleSelect(user)}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{user.username}</p>
                                    <p className="text-xs text-muted-foreground">{user.fullName}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


export default function NotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<PublicUser[]>([]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
        targetType: 'all',
        userIds: [],
    }
  });

  const targetType = watch('targetType');
  
  const addUser = (user: PublicUser) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
        const newSelectedUsers = [...selectedUsers, user];
        setSelectedUsers(newSelectedUsers);
        setValue('userIds', newSelectedUsers.map(u => u.id));
    }
  }

  const removeUser = (userId: string) => {
     const newSelectedUsers = selectedUsers.filter(u => u.id !== userId);
     setSelectedUsers(newSelectedUsers);
     setValue('userIds', newSelectedUsers.map(u => u.id));
  }

  const onSubmit = async (data: NotificationFormData) => {
    setLoading(true);
    try {
      const result = await sendNotification(
        {
            title: data.title,
            body: data.message,
        }, 
        {
            type: data.targetType,
            userIds: data.targetType === 'users' ? data.userIds : undefined,
            memberType: data.targetType === 'memberType' ? data.memberType as MemberType : undefined,
        }
    );

      toast({
        title: 'Notifikasi Dalam Proses Pengiriman!',
        description: `Berhasil mengirim ke ${result.successCount} perangkat. Gagal: ${result.failureCount}. ${result.message || ''}`,
      });
      reset();
      setSelectedUsers([]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Notifikasi',
        description: (error as Error).message || 'Terjadi kesalahan pada server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Manajemen Notifikasi</h1>
        <p className="text-muted-foreground">Kirim pesan dan pembaruan ke pengguna Anda.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buat Notifikasi Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
                <Label>Target Notifikasi</Label>
                <Controller
                    name="targetType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih target audiens" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Pengguna</SelectItem>
                                <SelectItem value="users">Pengguna Tertentu</SelectItem>
                                <SelectItem value="memberType">Jenis Keanggotaan</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            
            {targetType === 'users' && (
                <div className="space-y-2">
                    <Label>Pilih Pengguna</Label>
                    <UserSearch onAddUser={addUser} />
                    <div className="flex flex-wrap gap-2 pt-2">
                        {selectedUsers.map(user => (
                            <Badge key={user.id} variant="secondary" className="pl-1">
                                <Avatar className="h-5 w-5 mr-2">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.username}
                                <button type="button" onClick={() => removeUser(user.id)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
            
             {targetType === 'memberType' && (
                <div className="space-y-2">
                    <Label>Pilih Jenis Keanggotaan</Label>
                    <Controller
                        name="memberType"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis keanggotaan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {memberTypes.map(mt => (
                                        <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            )}


            <div className="space-y-2">
              <Label htmlFor="title">Judul Notifikasi</Label>
              <Input
                id="title"
                placeholder="Contoh: Acara Baru Telah Tiba!"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Isi Pesan</Label>
              <Textarea
                id="message"
                placeholder="Jelaskan detail notifikasi di sini..."
                {...register('message')}
              />
              {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
