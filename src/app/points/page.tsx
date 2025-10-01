
'use client';

import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Gift, History, Plus, Minus, Target, Copy, Users, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { getPointHistory, getRedeemableItems, getMissions, redeemItem, PointLog, RedeemableItem, Mission } from '@/app/actions/points';
import { getUserUplineStructure } from '@/app/actions/user';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart } from "recharts"


const PlaceholderContent = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
        <Icon className="h-12 w-12 mx-auto mb-4" />
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm">{description}</p>
    </div>
);

const MissionsList = () => {
    const { toast } = useToast();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMissions()
            .then(setMissions)
            .catch(() => toast({ variant: 'destructive', title: 'Gagal memuat misi' }))
            .finally(() => setLoading(false));
    }, [toast]);
    
    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin"/></div>
    }

    if (missions.length === 0) {
        return <PlaceholderContent icon={Target} title="Misi Kosong" description="Saat ini belum ada misi yang tersedia untuk mendapatkan poin." />;
    }

    return (
        <div className="space-y-4">
            {missions.map(mission => (
                <Card key={mission.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{mission.name}</CardTitle>
                        <div className="font-bold text-lg text-primary flex items-center gap-1">
                            <Coins className="h-5 w-5"/> +{mission.pointsPerLevel ? mission.pointsPerLevel[0] : mission.points}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

const RedeemList = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [items, setItems] = useState<RedeemableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
    const [itemToConfirm, setItemToConfirm] = useState<RedeemableItem | null>(null);

    useEffect(() => {
        getRedeemableItems()
            .then(setItems)
            .catch(() => toast({ variant: 'destructive', title: 'Gagal memuat hadiah' }))
            .finally(() => setLoading(false));
    }, [toast]);
    
    const handleRedeem = async () => {
        if (!user || !itemToConfirm) return;
        setIsRedeeming(itemToConfirm.id!);
        try {
            await redeemItem(user.uid, itemToConfirm.id!);
            toast({ title: 'Penukaran Berhasil!', description: `Anda telah menukar ${itemToConfirm.pointsRequired} poin untuk ${itemToConfirm.name}.`});
            await refreshUser(); // Refresh user points
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Menukar', description: (error as Error).message });
        } finally {
            setIsRedeeming(null);
            setItemToConfirm(null);
        }
    }

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin"/></div>
    }

    if (items.length === 0) {
        return <PlaceholderContent icon={Gift} title="Toko Hadiah Kosong" description="Saat ini belum ada hadiah yang bisa ditukar." />;
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                    <Card key={item.id} className="flex flex-col">
                        {item.imageUrl && (
                            <div className="relative aspect-square w-full">
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover rounded-t-lg" />
                            </div>
                        )}
                        <div className="p-4 flex flex-col flex-grow">
                             <h4 className="font-semibold text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground flex-grow mt-1">{item.description}</p>
                            <div className="text-xs mt-2">Stok: {item.stock}</div>
                        </div>
                        <CardFooter className="p-2 border-t">
                            <Button className="w-full" size="sm" onClick={() => setItemToConfirm(item)} disabled={item.stock === 0 || (user?.greenPoints || 0) < item.pointsRequired || !!isRedeeming}>
                                {isRedeeming === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                                    <div className="flex items-center gap-1">
                                        <Coins className="h-4 w-4"/> {item.pointsRequired}
                                    </div>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            <AlertDialog open={!!itemToConfirm} onOpenChange={() => setItemToConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Penukaran</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menukar <span className="font-bold">{itemToConfirm?.pointsRequired} Poin Hijau</span> untuk mendapatkan <span className="font-bold">{itemToConfirm?.name}</span>. Lanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRedeem}>Ya, Tukar Sekarang</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

const PointHistoryList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [history, setHistory] = useState<PointLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getPointHistory(user.uid)
                .then(setHistory)
                .catch(() => toast({ variant: 'destructive', title: 'Gagal memuat riwayat' }))
                .finally(() => setLoading(false));
        }
    }, [user, toast]);
    
    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin"/></div>
    }

    if (history.length === 0) {
        return <PlaceholderContent icon={History} title="Riwayat Kosong" description="Riwayat perolehan dan penukaran poin Anda akan muncul di sini." />;
    }

    return (
        <div className="space-y-4">
            {history.map(log => (
                 <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                        <p className="text-sm font-medium">{log.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}</p>
                    </div>
                    <div className={`font-bold flex items-center gap-1 ${log.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.points >= 0 ? <Plus className="h-4 w-4"/> : <Minus className="h-4 w-4"/>}
                        {Math.abs(log.points)}
                    </div>
                </div>
            ))}
        </div>
    )
}

const UplineChart = ({ structure }: { structure: Record<string, number>}) => {
    const chartData = Object.entries(structure).map(([name, value]) => ({ name, value }));

    const chartConfig = {
      value: {
        label: "Anggota",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;
    
    if (chartData.length === 0) {
        return <PlaceholderContent icon={Users} title="Data Rujukan Kosong" description="Ajak teman untuk mulai membangun jaringan Anda." />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Struktur Jaringan</CardTitle>
                <CardDescription className="text-xs">Jumlah anggota yang berhasil Anda rekrut per level.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <RechartsBarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                        <XAxis dataKey="value" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} layout="vertical" />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}


export default function GreenPointsPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [uplineStructure, setUplineStructure] = useState<Record<string, number>>({});
    
    const [invitationLink, setInvitationLink] = useState('');

    useEffect(() => {
        if (user?.username) {
            setInvitationLink(`${window.location.origin}/register?ref=${user.username}`);
        }
    }, [user?.username]);
    
    useEffect(() => {
        if (user) {
            getUserUplineStructure(user.uid).then(setUplineStructure);
        }
    }, [user]);

    
    const copyInvitationLink = () => {
        if (!invitationLink) return;
        navigator.clipboard.writeText(invitationLink);
        toast({ title: 'Tautan Undangan Disalin!' });
    }

    if (loading || !user) {
        return (
            <MainLayout>
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MainLayout>
        );
    }
    
    return (
        <MainLayout>
            <div className="p-6 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Poin & Rujukan Anda</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-center">
                         <div className="p-4 bg-muted rounded-lg">
                            <p className="text-3xl font-bold">{user.greenPoints || 0}</p>
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Coins className="h-3 w-3"/> Poin Hijau</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-3xl font-bold">{user.referralCount || 0}</p>
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3"/> Anggota Diajak</p>
                        </div>
                    </CardContent>
                </Card>

                {user.username && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Ajak Teman</CardTitle>
                            <CardDescription className="text-xs">Bagikan tautan ini dan dapatkan poin untuk setiap teman yang bergabung dan terverifikasi!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Input value={invitationLink} readOnly className="font-mono text-xs" />
                                <Button type="button" size="icon" variant="outline" onClick={copyInvitationLink}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                     </Card>
                )}
                
                <UplineChart structure={uplineStructure} />

                <Tabs defaultValue="redeem" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="missions">Misi</TabsTrigger>
                        <TabsTrigger value="redeem">Tukar Hadiah</TabsTrigger>
                        <TabsTrigger value="history">Riwayat</TabsTrigger>
                    </TabsList>
                    <TabsContent value="missions" className="mt-4">
                        <MissionsList />
                    </TabsContent>
                    <TabsContent value="redeem" className="mt-4">
                         <RedeemList />
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                        <PointHistoryList />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
