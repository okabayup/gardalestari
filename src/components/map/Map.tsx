
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import L from 'leaflet';
import { MapData, MapDataCategory, getMapData } from '@/app/actions/map-data';
import { categoryConfig } from '@/app/map/page';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const getMarkerIcon = (category: MapDataCategory) => {
    const config = categoryConfig[category];
    const color = config.color.match(/text-(.*)-500/)?.[1] || 'gray';
    
    const iconHtml = `<div style="background-color: ${color};" class="w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>`;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8]
    });
};

const createClusterCustomIcon = (cluster: any) => {
    return new L.DivIcon({
        html: `<span>${cluster.getChildCount()}</span>`,
        className: 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white shadow-lg',
        iconSize: L.point(40, 40, true),
    });
};


export default function MapComponent() {
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
       <>
        <style jsx global>{`
                .leaflet-container {
                    height: 100%;
                    width: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 10;
                }
                .marker-cluster-small,
                .marker-cluster-medium,
                .marker-cluster-large {
                    background-color: hsla(var(--primary) / 0.6) !important;
                }
                .marker-cluster-small div,
                .marker-cluster-medium div,
                .marker-cluster-large div {
                    background-color: hsla(var(--primary) / 0.8) !important;
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
                }
                .marker-cluster span {
                    line-height: 30px;
                }
             `}</style>
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
        <MapContainer
            center={[-2.548926, 118.014863]}
            zoom={5}
            scrollWheelZoom={true}
            style={{ height: 'calc(100vh)', position: 'absolute', top: 0, left: 0 }}
        >
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
       </>
    );
}
