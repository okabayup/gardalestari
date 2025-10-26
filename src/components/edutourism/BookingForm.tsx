
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createBooking } from '@/app/actions/booking';
import type { EduwisataPackage, Addon } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
    customerName: z.string().min(1, "Nama lengkap wajib diisi"),
    customerEmail: z.string().email("Format email tidak valid"),
    customerPhone: z.string().min(10, "Nomor telepon tidak valid"),
    bookingDate: z.date({ required_error: "Tanggal kunjungan wajib dipilih" }),
    participants: z.coerce.number().min(1, "Minimal 1 peserta"),
});

type FormData = z.infer<typeof formSchema>;

export default function BookingForm({ pkg, addons }: { pkg: EduwisataPackage, addons: Addon[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

    const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { participants: 1 }
    });
    
    const handleAddonQuantityChange = (addonId: string, quantity: number) => {
        setSelectedAddons(prev => ({ ...prev, [addonId]: Math.max(0, quantity) }));
    };

    const subtotal = useMemo(() => {
        const addonsTotal = Object.entries(selectedAddons).reduce((acc, [addonId, quantity]) => {
            const addon = addons.find(a => a.id === addonId);
            return acc + (addon?.price || 0) * quantity;
        }, 0);
        return (pkg.price * (control._getWatch('participants') || 1)) + addonsTotal;
    }, [selectedAddons, addons, pkg.price, control]);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const bookingPayload = {
                ...data,
                packageId: pkg.id,
                packageName: pkg.title,
                bookingDate: Timestamp.fromDate(data.bookingDate),
                selectedAddons: Object.entries(selectedAddons).filter(([, quantity]) => quantity > 0).map(([addonId, quantity]) => {
                    const addon = addons.find(a => a.id === addonId)!;
                    return { addonId, addonName: addon.name, quantity, price: addon.price };
                }),
            };
            const { bookingId, finalAmount } = await createBooking(bookingPayload);
            toast({ title: "Pemesanan Diterima!", description: "Silakan selesaikan pembayaran Anda." });
            router.push(`/edutourism/booking/confirm?bookingId=${bookingId}&amount=${finalAmount}`);
        } catch (error) {
            toast({ variant: 'destructive', title: "Gagal membuat pemesanan", description: (error as Error).message });
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customerName">Nama Lengkap</Label>
                    <Input id="customerName" {...register('customerName')} />
                    {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="participants">Jumlah Peserta</Label>
                    <Input id="participants" type="number" {...register('participants')} />
                    {errors.participants && <p className="text-xs text-destructive">{errors.participants.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input id="customerEmail" type="email" {...register('customerEmail')} />
                    {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customerPhone">No. Telepon</Label>
                    <Input id="customerPhone" {...register('customerPhone')} />
                    {errors.customerPhone && <p className="text-xs text-destructive">{errors.customerPhone.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Tanggal Kunjungan</Label>
                 <Controller
                    name="bookingDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.bookingDate && <p className="text-xs text-destructive">{errors.bookingDate.message}</p>}
            </div>
            {addons.length > 0 && (
                <div className="space-y-2 pt-4">
                    <Label>Tambahan (Add-ons)</Label>
                    <div className="space-y-2 rounded-md border p-4">
                        {addons.map(addon => (
                            <div key={addon.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-sm">{addon.name}</p>
                                    <p className="text-xs text-muted-foreground">Rp {addon.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => handleAddonQuantityChange(addon.id, (selectedAddons[addon.id] || 0) - 1)}><Minus className="h-4 w-4"/></Button>
                                     <span className="w-8 text-center">{selectedAddons[addon.id] || 0}</span>
                                     <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => handleAddonQuantityChange(addon.id, (selectedAddons[addon.id] || 0) + 1)}><Plus className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <div className="pt-4 text-right space-y-1">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-bold text-2xl">Rp {subtotal.toLocaleString('id-ID')}</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pesan Sekarang
            </Button>
        </form>
    );
}
