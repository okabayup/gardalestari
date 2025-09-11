
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon, Loader2, User, X, Tag, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ProjectTask, updateTask } from '@/app/actions/projects';
import type { MemberWithStatus } from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';


const formSchema = z.object({
    title: z.string().min(1, "Judul tidak boleh kosong"),
    description: z.string().optional(),
    dueDate: z.date().optional(),
    assigneeIds: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

const availableLabels = [
    { name: 'Penting', color: 'bg-red-500' },
    { name: 'Desain', color: 'bg-purple-500' },
    { name: 'Pengembangan', color: 'bg-blue-500' },
    { name: 'Pemasaran', color: 'bg-yellow-500 text-black' },
    { name: 'Dokumentasi', color: 'bg-gray-500' },
];

export default function TaskDetailDialog({ isOpen, onClose, task, teamMembers, projectId, onUpdate }: {
    isOpen: boolean;
    onClose: () => void;
    task: ProjectTask;
    teamMembers: MemberWithStatus[];
    projectId: string;
    onUpdate: () => void;
}) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const { control, register, handleSubmit, reset, watch } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate?.toDate(),
            assigneeIds: task.assigneeIds || [],
            labels: task.labels || [],
        },
    });

    useEffect(() => {
        reset({
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate?.toDate(),
            assigneeIds: task.assigneeIds || [],
            labels: task.labels || [],
        });
    }, [task, reset]);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const updateData: Partial<ProjectTask> = {
                ...data,
                dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : undefined,
            };
            await updateTask(projectId, task.id, updateData);
            toast({ title: "Tugas diperbarui" });
            onUpdate();
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <Input {...register('title')} className="text-lg font-bold border-none shadow-none -ml-3" />
                    </DialogHeader>
                    <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                             <div>
                                <Label>Deskripsi</Label>
                                <Textarea {...register('description')} rows={5} />
                            </div>
                            {/* Comments section placeholder */}
                        </div>
                        <div className="md:col-span-1 space-y-4">
                            <div>
                                <Label>Label</Label>
                                 <Controller
                                    name="labels"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal h-auto min-h-10">
                                                    {field.value?.length ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {field.value.map(l => <Badge key={l}>{l}</Badge>)}
                                                        </div>
                                                    ) : "Pilih label"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-56 p-0">
                                                <div className="p-2 space-y-1">
                                                    {availableLabels.map(label => (
                                                        <Label key={label.name} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                                                            <Checkbox
                                                                checked={field.value?.includes(label.name)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), label.name]
                                                                        : (field.value || []).filter(v => v !== label.name);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <Badge className={label.color}>{label.name}</Badge>
                                                        </Label>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                            <div>
                                <Label>Penanggung Jawab</Label>
                                <Controller
                                    name="assigneeIds"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal h-auto min-h-10">
                                                    {field.value?.length ? (
                                                        <div className="flex items-center gap-2">
                                                            {field.value.map(id => {
                                                                 const member = teamMembers.find(m => m.id === id);
                                                                 return member ? <Avatar key={id} className="h-6 w-6"><AvatarImage src={member.avatarUrl}/><AvatarFallback>{getInitials(member.name)}</AvatarFallback></Avatar> : null
                                                            })}
                                                        </div>
                                                    ) : "Pilih anggota"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-0">
                                                <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                                                    {teamMembers.map(member => (
                                                        <Label key={member.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                                                            <Checkbox
                                                                checked={field.value?.includes(member.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), member.id]
                                                                        : (field.value || []).filter(v => v !== member.id);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <Avatar className="h-6 w-6"><AvatarImage src={member.avatarUrl}/><AvatarFallback>{getInitials(member.name)}</AvatarFallback></Avatar>
                                                            <span>{member.name}</span>
                                                        </Label>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                             <div>
                                <Label>Batas Waktu</Label>
                                <Controller
                                    name="dueDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, 'dd MMM yyyy') : 'Pilih tanggal'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
