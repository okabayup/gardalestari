
'use client';

import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Gift, History, Plus, Minus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { getPointHistory, PointLog } from '@/app/actions/points';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const PlaceholderContent = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
        <Icon className="h-12 w-12 mx-auto mb-4" />
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm">{description}</p>
    </div>
);

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
                    <div className={`font-bold flex items-center gap-1 ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.points > 0 ? <Plus className="h-4 w-4"/> : <Minus className="h-4 w-4"/>}
                        {Math.abs(log.points)}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function GreenPointsPage() {
    const { user, loading } = useAuth();

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
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-6 w-6 text-primary" />
                            <span>Poin Hijau Anda</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="text-4xl font-bold">{user.greenPoints || 0}</div>
                        <Button>Tukar Poin</Button>
                    </CardContent>
                </Card>

                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="missions">Misi</TabsTrigger>
                        <TabsTrigger value="redeem">Tukar Hadiah</TabsTrigger>
                        <TabsTrigger value="history">Riwayat</TabsTrigger>
                    </TabsList>
                    <TabsContent value="missions" className="mt-4">
                        <PlaceholderContent icon={Coins} title="Misi Belum Tersedia" description="Fitur untuk mendapatkan poin melalui misi akan segera hadir." />
                    </TabsContent>
                    <TabsContent value="redeem" className="mt-4">
                         <PlaceholderContent icon={Gift} title="Toko Hadiah Belum Tersedia" description="Tempat menukarkan poin dengan hadiah akan segera hadir." />
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                        <PointHistoryList />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
