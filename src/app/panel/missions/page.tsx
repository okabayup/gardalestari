'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getMissions, createMission, updateMission, deleteMission, Mission } from '@/app/actions/points';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, PlusCircle, Edit, Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const missionSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  points: z.coerce.number().min(1, 'Poin harus lebih dari 0'),
  type: z.enum(['referral', 'content', 'event', 'social']),
  action: z.string().optional(),
});

type MissionFormData = z.infer<typeof missionSchema>;

const MissionFormDialog = ({ mission, onSave, isSaving, onClose }: { mission?: Mission | null; onSave: (data: MissionFormData) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission || { name: '', description: '', points: 5, type: 'content' },
  });

  useEffect(() => {
    reset(mission || { name: '', description: '', points: 5, type: 'content' });
  }, [mission, reset]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mission ? 'Edit Misi' : 'Tambah Misi Baru'}</DialogTitle>
          <DialogDescription>Atur tugas yang dapat diselesaikan anggota untuk mendapatkan poin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Misi</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Poin Diberikan</Label>
              <Input id="points" type="number" {...register('points')} />
              {errors.points && <p className="text-sm text-destructive">{errors.points.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Misi</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Rujukan</SelectItem>
                    <SelectItem value="content">Konten</SelectItem>
                    <SelectItem value="event">Acara</SelectItem>
                    <SelectItem value="social">Sosial</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="action">Tindakan (Action Hook)</Label>
            <Input id="action" {...register('action')} placeholder="Contoh: create_post_with_hashtag_#lestari" />
            <p className="text-xs text-muted-foreground">Opsional. Untuk developer, ini adalah kunci untuk memicu pemberian poin secara otomatis.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function MissionsPage() {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedMissions = await getMissions();
      setMissions(fetchedMissions);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat misi' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const handleSave = async (data: MissionFormData) => {
    setIsSaving(true);
    try {
      if (selectedMission?.id) {
        await updateMission(selectedMission.id, data);
        toast({ title: 'Misi berhasil diperbarui!' });
      } else {
        await createMission(data);
        toast({ title: 'Misi baru berhasil ditambahkan!' });
      }
      fetchMissions();
      setIsDialogOpen(false);
      setSelectedMission(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };
  
   const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus misi ini?")) return;
    try {
        await deleteMission(id);
        toast({title: "Misi dihapus"});
        fetchMissions();
    } catch(error) {
        toast({variant: 'destructive', title: "Gagal menghapus misi"});
    }
  }


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Misi</h1>
          <p className="text-muted-foreground">Atur berbagai cara bagi anggota untuk mendapatkan Poin Hijau.</p>
        </div>
        <Button onClick={() => { setSelectedMission(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Misi Baru
        </Button>
      </div>
      
       {isDialogOpen && <MissionFormDialog mission={selectedMission} onSave={handleSave} isSaving={isSaving} onClose={() => setIsDialogOpen(false)} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Misi</CardTitle>
          <CardDescription>Total {missions.length} misi tersedia.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : missions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {missions.map(mission => (
                <Card key={mission.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{mission.name}</CardTitle>
                    <CardDescription>{mission.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div className="font-bold text-lg text-primary">{mission.points} Poin</div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedMission(mission); setIsDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(mission.id!)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <Target className="mx-auto h-8 w-8 mb-2" />
                Belum ada misi yang dibuat.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
