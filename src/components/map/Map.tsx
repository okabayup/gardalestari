'use client';

import { useState, useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import { MapData, MapDataCategory, getMapData } from '@/app/actions/map-data';
import { categoryConfig } from '@/app/map/page';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper to create a custom marker icon
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

// Helper to create a custom icon for clusters
const createClusterCustomIcon = (cluster: any) => {
    return new L.DivIcon({
        html: `<span>${cluster.getChildCount()}</span>`,
        className: 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white shadow-lg',
        iconSize: L.point(40, 40, true),
    });
};


export default function Map() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<LeafletMap | null>(null);
    const markerClusterGroup = useRef<L.MarkerClusterGroup | null>(null);
    
    const { toast } = useToast();
    const [allData, setAllData] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<MapDataCategory[]>(['potensi', 'permasalahan', 'program', 'kegiatan', 'dana']);

    // Fetch data on initial render
    useEffect(() => {
        setLoading(true);
        getMapData()
            .then(setAllData)
            .catch(() => toast({ variant: 'destructive', title: 'Gagal memuat data peta' }))
            .finally(() => setLoading(false));
    }, [toast]);
    
    // Initialize the map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                center: [-2.548926, 118.014863],
                zoom: 5,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);

            markerClusterGroup.current = L.markerClusterGroup({
                iconCreateFunction: createClusterCustomIcon,
            });
            mapInstance.current.addLayer(markerClusterGroup.current);
        }

        // Cleanup on unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update markers when data or filters change
    useEffect(() => {
        if (!markerClusterGroup.current) return;

        markerClusterGroup.current.clearLayers();

        const filteredData = allData.filter(item => selectedCategories.includes(item.category));
        
        filteredData.forEach(item => {
            const popupContent = `
                <div class="space-y-1">
                    <h3 class="font-bold">${item.title}</h3>
                    <p class="text-sm">${item.description}</p>
                    ${(item.category === 'program' || item.category === 'dana') ? `
                        <p class="text-xs">Anggaran: ${item.budget?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                        <p class="text-xs">Tersalurkan: ${item.disbursed?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                    ` : ''}
                </div>
            `;
            const marker = L.marker([item.latitude, item.longitude], {
                icon: getMarkerIcon(item.category)
            }).bindPopup(popupContent);
            markerClusterGroup.current?.addLayer(marker);
        });

    }, [allData, selectedCategories]);
    
    const handleCategoryChange = (category: MapDataCategory, checked: boolean) => {
        setSelectedCategories(prev => 
            checked ? [...prev, category] : prev.filter(c => c !== category)
        );
    };

    return (
        <div className="h-full w-full relative">
            <style jsx global>{`
                .leaflet-container { height: 100%; width: 100%; }
                .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background-color: hsla(var(--primary) / 0.6) !important; }
                .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div { background-color: hsla(var(--primary) / 0.8) !important; }
                .marker-cluster div { color: hsl(var(--primary-foreground)); }
            `}</style>

            <div className="absolute top-4 right-4 z-[1000] space-y-2 md:top-20">
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
                <div className="absolute inset-0 bg-background/50 z-[1001] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            <div ref={mapRef} className="z-10" />
        </div>
    );
}