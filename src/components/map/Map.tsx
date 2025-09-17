
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import L, { Map as LeafletMap } from 'leaflet';
import { useToast } from '@/hooks/use-toast';
import { MapData, MapDataCategory, getMapData } from '@/app/actions/map-data';
import { categoryConfig } from '@/app/map/page';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';

// --- Helper Functions ---

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

// --- Map Rendering Component ---

interface MapRendererProps {
    data: MapData[];
    setMap: React.Dispatch<React.SetStateAction<LeafletMap | null>>;
}

function MapRenderer({ data, setMap }: MapRendererProps) {
    return (
        <MapContainer 
            center={[-2.548926, 118.014863]} 
            zoom={5} 
            scrollWheelZoom={true} 
            className="h-full w-full z-10"
            whenCreated={setMap}
        >
             <style jsx global>{`
                .leaflet-container { height: 100%; width: 100%; z-index: 10; }
                .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background-color: hsla(var(--primary) / 0.6) !important; }
                .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div { background-color: hsla(var(--primary) / 0.8) !important; }
                .marker-cluster div { color: hsl(var(--primary-foreground)); }
            `}</style>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
                {data.map(item => (
                    <Marker key={item.id} position={[item.latitude, item.longitude]} icon={getMarkerIcon(item.category)}>
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
    )
}


// --- Main Component with State Logic ---

export default function Map() {
    const { toast } = useToast();
    const [allData, setAllData] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<MapDataCategory[]>(['potensi', 'permasalahan', 'program', 'kegiatan', 'dana']);
    const [map, setMap] = useState<LeafletMap | null>(null);

    useEffect(() => {
        getMapData()
            .then(setAllData)
            .catch(() => toast({ variant: 'destructive', title: 'Gagal memuat data peta' }))
            .finally(() => setLoading(false));
    }, [toast]);
    
    const handleCategoryChange = (category: MapDataCategory, checked: boolean) => {
        setSelectedCategories(prev => 
            checked ? [...prev, category] : prev.filter(c => c !== category)
        );
    };

    const filteredData = useMemo(() => {
        return allData.filter(item => selectedCategories.includes(item.category));
    }, [allData, selectedCategories]);


    return (
        <div className="h-full w-full relative">
            <div className="absolute top-4 right-4 z-20 space-y-2 md:top-20">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <Layers className="h-5 w-5" />
                            <span className="sr-only">Filter Lapisan</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Filter Lapisan Peta</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-4 py-4">
                            {Object.entries(categoryConfig).map(([key, { label }]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={selectedCategories.includes(key as MapDataCategory)}
                                        onCheckedChange={(checked) => handleCategoryChange(key as MapDataCategory, !!checked)}
                                    />
                                    <Label htmlFor={key} className="flex-1 cursor-pointer">{label}</Label>
                                </div>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-background/50 z-30 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            {map ? <MapRenderer data={filteredData} setMap={setMap}/> : <MapRenderer data={filteredData} setMap={setMap}/>}
        </div>
    );
}
