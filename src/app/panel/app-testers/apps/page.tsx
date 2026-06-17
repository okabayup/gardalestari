'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAppTesterApps, createAppTesterApp, deleteAppTesterApp, AppTesterApp } from '@/app/actions/app-testers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, MoreHorizontal, Trash2, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SHORTLINK_DOMAIN } from '@/lib/definitions';

const formSchema = z.object({
  name: z.string().min(3, "Nama aplikasi minimal 3 karakter"),
  testingLink: z.string().url("URL tidak valid"),
});
type FormData = z.infer<typeof formSchema>;

const AppFormDialog = ({ onSave, isSaving }: { onSave: (data: FormData) => void; isSaving: boolean; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(formSchema) });
    
    const handleFormSubmit = async (data: FormData) => {
        await onSave(data);
        reset();
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Aplikasi
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Aplikasi Baru</DialogTitle>
                    <DialogDescription>Masukkan detail aplikasi yang ingin Anda buka untuk pengujian.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Aplikasi</Label>
                        <Input id="name" {...register('name')} placeholder="Contoh: Aplikasi Petani Cerdas" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="testingLink">Tautan Pengujian</Label>
                        <Input id="testingLink" {...register('testingLink')} placeholder="https://play.google.com/store/apps/testing/..." />
                        {errors.testingLink && <p className="text-sm text-destructive">{errors.testingLink.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Aplikasi
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default function ManageTesterAppsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [apps, setApps] = useState<AppTesterApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<AppTesterApp | null>(null);

    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAppTesterApps();
            setApps(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Gagal memuat aplikasi" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const handleSave = async (data: FormData) => {
        setIsSaving(true);
        try {
            await createAppTesterApp(data);
            toast({ title: "Aplikasi berhasil ditambahkan!" });
            fetchApps();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    }

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteAppTesterApp(itemToDelete.id!);
            toast({ title: 'Aplikasi berhasil dihapus' });
            fetchApps();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal menghapus', description: (error as Error).message });
        } finally {
            setItemToDelete(null);
        }
    }

    return (
        <>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-2xl font-bold">Kelola Aplikasi Pengujian</h1>
                    <p className="text-muted-foreground">Tambah atau hapus aplikasi yang tersedia untuk diuji.</p>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/panel/app-testers')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Pendaftar
                    </Button>
                    <AppFormDialog onSave={handleSave} isSaving={isSaving} />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Aplikasi</CardTitle>
                </CardHeader>
                <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Aplikasi</TableHead>
                                <TableHead>Shortlink Pendaftaran</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apps.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium">{app.name}</TableCell>
                                    <TableCell>
                                        <a href={`${SHORTLINK_DOMAIN}/${app.shortlinkSlug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                            {`${SHORTLINK_DOMAIN}/${app.shortlinkSlug}`} <LinkIcon className="h-3 w-3" />
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setItemToDelete(app)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {apps.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-10">Belum ada aplikasi yang ditambahkan.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Aplikasi Ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Ini akan menghapus aplikasi <span className="font-bold">"{itemToDelete?.name}"</span> dan shortlink pendaftarannya. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Ya, Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
