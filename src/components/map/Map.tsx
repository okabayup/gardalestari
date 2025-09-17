
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useToast } from '@/hooks/use-toast';
import { getMapData } from '@/app/actions/map-data';
import type { MapData, MapDataCategory } from '@/lib/definitions';
import { categoryConfig } from '@/app/map/page';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import React from 'react';

const MapMarkers = ({ items }: { items: MapData[] }) => {
    const map = useMap();
    const [markers, setMarkers] = useState<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
    const clusterer = useRef<MarkerClusterer | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<MapData | null>(null);

    useEffect(() => {
        if (!map) return;
        if (!clusterer.current) {
            clusterer.current = new MarkerClusterer({ map });
        }
    }, [map]);
    
    useEffect(() => {
        clusterer.current?.clearMarkers();
        clusterer.current?.addMarkers(Object.values(markers));
    }, [markers]);

    const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, item: MapData) => {
        if (marker && markers[item.id!] !== marker) {
            setMarkers(prev => ({ ...prev, [item.id!]: marker }));
            
            // Add click listener
            marker.addListener('click', () => {
                setSelectedMarker(item);
            });
        }
    };
    
    return (
        <>
            {items.map(item => (
                 <AdvancedMarker
                    position={{lat: item.latitude, lng: item.longitude}}
                    key={item.id}
                    ref={marker => setMarkerRef(marker, item)}
                 >
                    <Pin background={categoryConfig[item.category].color} borderColor={categoryConfig[item.category].color} glyphColor={"#fff"}/>
                 </AdvancedMarker>
            ))}
            {selectedMarker && (
                 <InfoWindow
                    position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                    onCloseClick={() => setSelectedMarker(null)}
                    minWidth={200}
                >
                    <div className="space-y-1 p-1">
                        <h3 className="font-bold">{selectedMarker.title}</h3>
                        <p className="text-sm">{selectedMarker.description}</p>
                        {(selectedMarker.category === 'program' || selectedMarker.category === 'dana') && (
                            <>
                                {selectedMarker.budget ? <p className="text-xs">Anggaran: {selectedMarker.budget?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p> : null}
                                {selectedMarker.disbursed ? <p className="text-xs">Tersalurkan: {selectedMarker.disbursed?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p> : null}
                            </>
                        )}
                    </div>
                </InfoWindow>
            )}
        </>
    )
}

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
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'garda-lestari-map'}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                className="h-full w-full"
            >
                <MapMarkers items={filteredData} />
            </Map>
        </div>
    )
}
