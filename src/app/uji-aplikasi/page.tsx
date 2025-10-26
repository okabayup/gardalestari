'use client';

import { useState, useEffect } from 'react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube2, AlertTriangle, PackageSearch } from 'lucide-react';
import { getAppTesterApps, AppTesterApp } from '@/app/actions/app-testers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AppTesterSelectionPage() {
  const { toast } = useToast();
  const [apps, setApps] = useState<AppTesterApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const fetchedApps = await getAppTesterApps();
        setApps(fetchedApps);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Aplikasi',
          description: (error as Error).message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [toast]);


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <TestTube2 className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="font-headline text-3xl font-bold">Program Pengujian Aplikasi</h1>
            <p className="text-muted-foreground mt-2">
              Jadilah orang pertama yang mencoba fitur-fitur terbaru dan bantu kami membangun aplikasi yang lebih baik.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pilih Aplikasi untuk Diuji</CardTitle>
              <CardDescription>
                Pilih salah satu aplikasi di bawah ini untuk mendaftar sebagai penguji.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : apps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {apps.map(app => (
                            <Button key={app.id} asChild variant="outline" className="h-auto p-4 justify-start text-left">
                                <Link href={`/uji-aplikasi/${app.shortlinkSlug}`}>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{app.name}</span>
                                        <span className="text-xs text-muted-foreground">Klik untuk mendaftar</span>
                                    </div>
                                </Link>
                            </Button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <PackageSearch className="mx-auto h-10 w-10 mb-2"/>
                        <p>Saat ini tidak ada program pengujian aplikasi yang dibuka.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
