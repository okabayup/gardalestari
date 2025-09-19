
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAnalyticsReport, AnalyticsReport } from '@/app/actions/analytics';
import { getPageSpeedReport, PageSpeedReport } from '@/app/actions/pagespeed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Eye, LineChart, Gauge, Accessibility, ShieldCheck, SearchCheck } from 'lucide-react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format } from 'date-fns';

const MetricCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const PageSpeedGauge = ({ score, label, icon: Icon }: { score: number, label: string, icon: React.ElementType }) => {
    const getScoreColor = (s: number) => {
        if (s >= 90) return 'text-green-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2 text-center p-4 bg-muted/50 rounded-lg">
             <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(score * 100)}`}>{(score * 100).toFixed(0)}</p>
        </div>
    )
}

export default function PerformancePage() {
    const { toast } = useToast();
    const [analyticsData, setAnalyticsData] = useState<AnalyticsReport | null>(null);
    const [pageSpeedData, setPageSpeedData] = useState<PageSpeedReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
                const endDate = format(new Date(), 'yyyy-MM-dd');

                const [analytics, pagespeed] = await Promise.all([
                    getAnalyticsReport(
                        [{ name: 'date' }, { name: 'pagePath' }],
                        [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
                        [{ startDate, endDate }]
                    ),
                    getPageSpeedReport(process.env.NEXT_PUBLIC_BASE_URL || 'https://gardalestari.org')
                ]);
                setAnalyticsData(analytics);
                setPageSpeedData(pagespeed);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Gagal Memuat Data Performa', description: (error as Error).message });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [toast]);
    
    // Process analytics data
    const totalUsers = analyticsData?.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value, 10), 0);
    const totalSessions = analyticsData?.rows.reduce((sum, row) => sum + parseInt(row.metricValues[1].value, 10), 0);
    const totalPageViews = analyticsData?.rows.reduce((sum, row) => sum + parseInt(row.metricValues[2].value, 10), 0);

    const trafficByDate = analyticsData?.rows.reduce((acc, row) => {
        const date = format(new Date(row.dimensionValues[0].value), 'dd MMM');
        const users = parseInt(row.metricValues[0].value, 10);
        acc[date] = (acc[date] || 0) + users;
        return acc;
    }, {} as {[key: string]: number});
    
    const chartData = trafficByDate ? Object.entries(trafficByDate).map(([date, users]) => ({ date, users })).reverse() : [];
    
    const topPages = analyticsData?.rows.reduce((acc, row) => {
        const path = row.dimensionValues[1].value;
        const views = parseInt(row.metricValues[2].value, 10);
        acc[path] = (acc[path] || 0) + views;
        return acc;
    }, {} as {[key: string]: number});
    
    const sortedTopPages = topPages ? Object.entries(topPages).sort(([,a],[,b]) => b-a).slice(0, 5) : [];

     const chartConfig = {
        users: { label: "Pengguna", color: "hsl(var(--primary))" },
    } satisfies ChartConfig;

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-2xl font-bold">Manajemen Performa</h1>
                    <p className="text-muted-foreground">Analisis lalu lintas dan kecepatan situs Anda.</p>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MetricCard title="Total Pengguna" value={totalUsers?.toLocaleString() || '0'} icon={Users} description="30 hari terakhir" />
                <MetricCard title="Total Sesi" value={totalSessions?.toLocaleString() || '0'} icon={LineChart} description="30 hari terakhir" />
                <MetricCard title="Total Tampilan Halaman" value={totalPageViews?.toLocaleString() || '0'} icon={Eye} description="30 hari terakhir" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tren Pengguna Aktif (30 Hari Terakhir)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 6)} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Area dataKey="users" type="natural" fill="var(--color-users)" fillOpacity={0.4} stroke="var(--color-users)" />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
             <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Halaman Terpopuler</CardTitle>
                        <CardDescription>5 halaman paling banyak dilihat dalam 30 hari terakhir.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Halaman</TableHead>
                                    <TableHead className="text-right">Tampilan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTopPages.map(([path, views]) => (
                                    <TableRow key={path}>
                                        <TableCell className="font-medium truncate max-w-[200px]">{path}</TableCell>
                                        <TableCell className="text-right">{views.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Performa Halaman (Mobile)</CardTitle>
                        <CardDescription>Analisis dari Google PageSpeed Insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <PageSpeedGauge score={pageSpeedData?.lighthouseResult.categories.performance.score || 0} label="Performa" icon={Gauge}/>
                            <PageSpeedGauge score={pageSpeedData?.lighthouseResult.categories.accessibility.score || 0} label="Aksesibilitas" icon={Accessibility}/>
                            <PageSpeedGauge score={pageSpeedData?.lighthouseResult.categories['best-practices'].score || 0} label="Praktik Terbaik" icon={ShieldCheck}/>
                            <PageSpeedGauge score={pageSpeedData?.lighthouseResult.categories.seo.score || 0} label="SEO" icon={SearchCheck}/>
                        </div>
                        <CardDescription className="text-xs text-center pt-2">Skor 90-100 bagus (hijau), 50-89 perlu perbaikan (kuning), 0-49 buruk (merah).</CardDescription>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
