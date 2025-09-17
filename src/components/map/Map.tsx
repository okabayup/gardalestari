
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useToast } from '@/hooks/use-toast';
import { MapData, MapDataCategory, getMapData } from '@/app/actions/map-data';
import { categoryConfig } from '@/app/map/page';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';

const MapMarker = ({ item }: { item: MapData }) => {
    const [infoWindowShown, setInfoWindowShown] = useState(false);
    const config = categoryConfig[item.category];

    const glyph = <config.icon className="h-5 w-5 text-white" />;

    return (
        <>
            <AdvancedMarker
                position={{ lat: item.latitude, lng: item.longitude }}
                onClick={() => setInfoWindowShown(true)}
            >
                <Pin background={config.color} borderColor={config.color} glyph={glyph} />
            </AdvancedMarker>
            {infoWindowShown && (
                <InfoWindow
                    position={{ lat: item.latitude, lng: item.longitude }}
                    onCloseClick={() => setInfoWindowShown(false)}
                    minWidth={200}
                >
                    <div className="space-y-1 p-1">
                        <h3 className="font-bold">{item.title}</h3>
                        <p className="text-sm">{item.description}</p>
                        {(item.category === 'program' || item.category === 'dana') && (
                            <>
                                {item.budget ? <p className="text-xs">Anggaran: {item.budget?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p> : null}
                                {item.disbursed ? <p className="text-xs">Tersalurkan: {item.disbursed?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p> : null}
                            </>
                        )}
                    </div>
                </InfoWindow>
            )}
        </>
    );
};

const Markers = ({ items }: { items: MapData[] }) => {
    const map = useMap();
    const [markers, setMarkers] = useState<Record<string, AdvancedMarker>>({});
    const clusterer = useMemo(() => {
        if (!map) return null;
        return new MarkerClusterer({ map });
    }, [map]);

    useEffect(() => {
        if (!clusterer) return;
        
        // Clear previous markers
        clusterer.clearMarkers();

        // Create a map to hold new marker elements
        const newMarkers: { [key: string]: HTMLElement } = {};
        
        // Create marker elements for each item
        items.forEach(item => {
            const config = categoryConfig[item.category];
            const pin = new Pin({
                background: config.color,
                borderColor: config.color,
                glyph: new config.icon(), // Note: This might not render complex icons well, a simpler glyph might be better
            });
            const markerElement = new AdvancedMarker({
                position: { lat: item.latitude, lng: item.longitude },
                content: pin.element,
                title: item.title,
            });
            newMarkers[item.id!] = markerElement;
        });
        
        // Add new markers to clusterer
        clusterer.addMarkers(Object.values(newMarkers));
        
    }, [items, clusterer]);

    return (
        <>
            {items.map(item => (
                <MapMarker key={item.id} item={item} />
            ))}
        </>
    );
};

export default function MapComponent() {
    const { toast } = useToast();
    const [allData, setAllData] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<MapDataCategory[]>(['potensi', 'permasalahan', 'program', 'kegiatan', 'dana']);

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
             <div className="absolute top-4 right-4 z-10 space-y-2 md:top-20">
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
                <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <Map
                defaultCenter={{lat: -2.548926, lng: 118.014863}}
                defaultZoom={5}
                mapId="garda-lestari-map"
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                className="h-full w-full"
            >
                {filteredData.map(item => <MapMarker key={item.id} item={item} />)}
            </Map>
        </div>
    )
}
