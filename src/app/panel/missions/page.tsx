

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getMissions, createMission, updateMission, deleteMission, Mission } from '@/app/actions/points';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, PlusCircle, Edit, Target, MinusCircle, Coins } from 'lucide-react';
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
import { BADGE_METRICS } from '@/lib/definitions';

const missionSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  points: z.coerce.number().optional(),
  pointsPerLevel: z.array(z.coerce.number().min(0)).optional(),
  type: z.enum(['referral', 'auto']),
  criteria: z.object({
      metric: z.string().optional(),
      value: z.coerce.number().optional(),
  }).optional(),
}).refine(data => {
    if (data.type === 'referral') {
        return (data.pointsPerLevel?.length || 0) > 0 && (data.pointsPerLevel || []).every(p => p > 0);
    }
    if (data.type === 'auto') {
        return !!data.criteria?.metric && (data.criteria.value || 0) > 0 && (data.points || 0) > 0;
    }
    return false;
}, {
    message: 'Detail poin, metrik, dan nilai target harus diisi dengan benar.',
    path: ['points'],
});


type MissionFormData = z.infer<typeof missionSchema>;

const MissionFormDialog = ({ mission, onSave, isSaving, onClose }: { mission?: Mission | null; onSave: (data: MissionFormData) => void; isSaving: boolean; onClose: () => void }) => {
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission || { name: '', description: '', points: 5, type: 'auto', pointsPerLevel: [100, 50, 25], criteria: { metric: 'post_count', value: 1 } },
  });
  
  const { fields, append, remove } = useFieldArray({
      control,
      name: "pointsPerLevel",
  });

  const missionType = watch('type');

  useEffect(() => {
    const defaultValues: MissionFormData = {
        name: mission?.name || '',
        description: mission?.description || '',
        type: mission?.type || 'auto',
        points: mission?.points || 10,
        pointsPerLevel: mission?.pointsPerLevel || [100, 50, 25],
        criteria: mission?.criteria || { metric: 'post_count', value: 1 },
    };
    reset(defaultValues);
  }, [mission, reset]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
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
          <div className="space-y-2">
              <Label htmlFor="type">Tipe Misi</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Otomatis (berdasarkan aksi)</SelectItem>
                    <SelectItem value="referral">Rujukan (bertingkat)</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>
          
          {missionType === 'auto' && (
            <Card className="bg-muted/50 p-4 space-y-2">
                 <div className="space-y-2">
                    <Label>Poin Diberikan</Label>
                    <Input type="number" {...register('points')} />
                    {errors.points && <p className="text-sm text-destructive">{errors.points.message}</p>}
                 </div>
                 <div className="space-y-2">
                    <Label>Metrik Pencapaian</Label>
                    <Controller name="criteria.metric" control={control} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Pilih metrik..."/></SelectTrigger>
                            <SelectContent>
                                {BADGE_METRICS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )} />
                </div>
                 <div className="space-y-2">
                    <Label>Nilai Target</Label>
                    <Input type="number" {...register('criteria.value')} placeholder="Contoh: 10"/>
                    <p className="text-xs text-muted-foreground">Poin akan diberikan setiap kali anggota mencapai kelipatan nilai ini.</p>
                </div>
                {errors.criteria && <p className="text-sm text-destructive">{errors.criteria.message}</p>}
            </Card>
          )}

          {missionType === 'referral' && (
              <div className="space-y-2 rounded-md border p-4">
                  <Label>Poin per Level Rujukan</Label>
                  <p className="text-xs text-muted-foreground">Level 1 adalah perujuk langsung, Level 2 adalah perujuk dari perujuk, dst.</p>
                  {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                          <Label className="w-20">Level {index + 1}</Label>
                          <Input type="number" {...register(`pointsPerLevel.${index}` as const)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><MinusCircle className="h-4 w-4"/></Button>
                      </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append(0)}><PlusCircle className="mr-2 h-4 w-4"/> Tambah Level</Button>
                  {errors.pointsPerLevel && <p className="text-sm text-destructive">{errors.pointsPerLevel.message || errors.pointsPerLevel.root?.message}</p>}
              </div>
          )}

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
        const payload = { ...data };
        if(data.type === 'auto') {
            payload.pointsPerLevel = undefined;
        } else if (data.type === 'referral') {
            payload.points = undefined;
            payload.criteria = undefined;
        }

      if (selectedMission?.id) {
        await updateMission(selectedMission.id, payload);
        toast({ title: 'Misi berhasil diperbarui!' });
      } else {
        await createMission(payload);
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
                     <div className="font-bold text-lg text-primary flex items-center gap-1">
                        <Coins className="h-5 w-5"/>
                        <span>{mission.pointsPerLevel ? `${mission.pointsPerLevel[0]} (Lvl 1)` : mission.points}</span>
                    </div>
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

