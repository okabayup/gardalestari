
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
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });
const MarkerClusterGroup = dynamic(() => import('react-leaflet-markercluster'), { ssr: false });


const categoryConfig: Record<MapDataCategory, { label: string; icon: React.ElementType; color: string }> = {
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
    
    const [L, setL] = useState<any>(null);
    useEffect(() => {
        // Dynamically import Leaflet on the client side
        import('leaflet').then(leaflet => {
            setL(leaflet);
        });
    }, []);

    const getMarkerIcon = (category: MapDataCategory) => {
        if (!L) return undefined;
        const config = categoryConfig[category];
        const color = config.color.match(/text-(.*)-500/)?.[1] || 'gray';
        
        const iconHtml = `<div style="background-color: ${color};" class="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg"></div>`;

        return L.divIcon({
            html: iconHtml,
            className: 'custom-marker-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    };
    
    const createClusterCustomIcon = (cluster: any) => {
        if (!L) return new L.DivIcon({
            html: `<span>${cluster.getChildCount()}</span>`,
            className: 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm',
            iconSize: L.point(40, 40, true),
        });

        return new L.DivIcon({
            html: `<span>${cluster.getChildCount()}</span>`,
            className: 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm',
            iconSize: L.point(40, 40, true),
        });
    };


    if (loading || !L) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="relative h-full w-full">
             <style jsx global>{`
                .leaflet-container {
                    height: 100vh;
                    width: 100%;
                }
                .marker-cluster-small {
                    background-color: hsla(var(--primary) / 0.6);
                }
                .marker-cluster-small div {
                    background-color: hsla(var(--primary) / 0.8);
                }
                .marker-cluster-medium {
                    background-color: hsla(var(--primary) / 0.6);
                }
                .marker-cluster-medium div {
                    background-color: hsla(var(--primary) / 0.8);
                }
                .marker-cluster-large {
                    background-color: hsla(var(--primary) / 0.6);
                }
                .marker-cluster-large div {
                    background-color: hsla(var(--primary) / 0.8);
                }
                .marker-cluster div {
                    width: 30px;
                    height: 30px;
                    margin-left: 5px;
                    margin-top: 5px;
                    color: hsl(var(--primary-foreground));
                    text-align: center;
                    border-radius: 15px;
                    font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
                    line-height: 30px;
                }
                .marker-cluster span {
                    line-height: 30px;
                }
             `}</style>
            <MapContainer center={[-2.548926, 118.014863]} zoom={5} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
                    {filteredData.map(item => (
                        <Marker 
                            key={item.id} 
                            position={[item.latitude, item.longitude]}
                            icon={getMarkerIcon(item.category)}
                        >
                            <Tooltip>{categoryConfig[item.category].label}: {item.title}</Tooltip>
                            <Popup>
                                <div className="space-y-1">
                                    <h3 className="font-bold">{item.title}</h3>
                                    <p className="text-sm">{item.description}</p>
                                    {(item.category === 'program' || item.category === 'dana') && (
                                        <>
                                            <p className="text-xs">Anggaran: {item.budget?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                                            <p className="text-xs">Tersalurkan: {item.disbursed?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                                        </>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
            
            {/* Filter and Data Sheet Buttons */}
            <div className="absolute top-20 right-2 z-[1000] space-y-2">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-background/80"><Layers className="h-4 w-4" /></Button>
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
                       <Button variant="outline" size="icon" className="bg-background/80"><Table className="h-4 w-4" /></Button>
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
