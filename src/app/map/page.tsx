
'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { getMapData, MapData, MapDataCategory } from '@/app/actions/map-data';
import { Loader2, Layers, HandCoins, Sprout, Siren, ClipboardList, HelpingHand } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/map/Map'), { 
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});


export const categoryConfig: Record<MapDataCategory, { label: string; icon: React.ElementType; color: string }> = {
    potensi: { label: 'Potensi', icon: Sprout, color: 'text-green-500' },
    permasalahan: { label: 'Permasalahan', icon: Siren, color: 'text-red-500' },
    program: { label: 'Program', icon: ClipboardList, color: 'text-blue-500' },
    kegiatan: { label: 'Kegiatan', icon: HelpingHand, color: 'text-yellow-500' },
    dana: { label: 'Dana', icon: HandCoins, color: 'text-purple-500' },
};

export default function MapPage() {
    const { toast } = useToast();
    const [allData, setAllData] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<MapDataCategory[]>(['potensi', 'permasalahan', 'program', 'kegiatan', 'dana']);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getMapData();
                setAllData(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Gagal memuat data peta' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const filteredData = useMemo(() => {
        return allData.filter(item => selectedCategories.includes(item.category));
    }, [allData, selectedCategories]);
    
    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="relative h-full w-full">
            <Map data={filteredData} />
            
            {/* Filter and Data Sheet Buttons */}
            <div className="absolute top-4 right-4 z-[1000] space-y-2 md:top-20">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-background/80 shadow-md"><Layers className="h-4 w-4" /></Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Filter Layer Peta</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                            {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={selectedCategories.includes(key as MapDataCategory)}
                                        onCheckedChange={(checked) => {
                                            setSelectedCategories(prev => 
                                                checked ? [...prev, key as MapDataCategory] : prev.filter(c => c !== key)
                                            );
                                        }}
                                    />
                                    <Label htmlFor={key} className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" /> {label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
                 <Sheet>
                    <SheetTrigger asChild>
                       <Button variant="outline" size="icon" className="bg-background/80 shadow-md"><Table className="h-4 w-4" /></Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-4/5 flex flex-col">
                        <SheetHeader>
                            <SheetTitle>Tabel Data Peta</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Judul</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.title}</TableCell>
                                            <TableCell>{categoryConfig[item.category].label}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
