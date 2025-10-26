

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle, TestTube2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTesterApplications, approveTesterApplication, rejectTesterApplication, AppTester } from '@/app/actions/app-testers';
import { DataTable } from '@/components/panel/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/panel/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AppTestersPage() {
  const [applications, setApplications] = useState<AppTester[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const data = await getTesterApplications();
        setApplications(data);
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
    fetchApplications();
  }, [toast]);
  
  const handleApprove = async (id: string) => {
    try {
      await approveTesterApplication(id);
      toast({ title: 'Aplikasi Disetujui', description: 'Notifikasi telah dikirim ke pengguna.' });
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'approved' } : app));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Menyetujui', description: (error as Error).message });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectTesterApplication(id);
      toast({ title: 'Aplikasi Ditolak' });
       setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'rejected' } : app));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Menolak', description: (error as Error).message });
    }
  };


  const columns: ColumnDef<AppTester>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" /> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'appName', header: 'Aplikasi yg Diuji' },
    { accessorKey: 'reason', header: 'Alasan Bergabung', cell: ({ row }) => <p className="max-w-xs truncate">{row.original.reason}</p> },
    { accessorKey: 'submittedAt', header: 'Tanggal', cell: ({ row }) => format(row.original.submittedAt.toDate(), 'dd MMM yyyy') },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={row.original.status === 'approved' ? 'default' : row.original.status === 'rejected' ? 'destructive' : 'secondary'}>{row.original.status}</Badge>
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const app = row.original;
        return app.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleApprove(app.id!)}>Setujui</Button>
            <Button size="sm" variant="destructive" onClick={() => handleReject(app.id!)}>Tolak</Button>
          </div>
        ) : null;
      },
    },
  ];

  const toolbarButtons = (
     <Button variant="outline" onClick={() => router.push('/panel/app-testers/apps')}>
        <TestTube2 className="mr-2 h-4 w-4" />
        Kelola Aplikasi
    </Button>
  );

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">Aplikasi Penguji Internal</h1>
        <p className="text-muted-foreground">Tinjau dan kelola pendaftar untuk program pengujian aplikasi versi beta.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pendaftar</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={applications} placeholder="Cari nama, email, atau aplikasi..." toolbarButtons={toolbarButtons} />
        </CardContent>
      </Card>
    </div>
  );
}
