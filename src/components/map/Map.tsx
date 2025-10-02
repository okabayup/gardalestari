
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useToast } from '@/hooks/use-toast';
import { getMapData } from '@/app/actions/map-data';
import { getMapDatasets, MapDataset } from '@/app/actions/map-datasets'; // Updated import
import type { MapData, MapDataCategory } from '@/lib/definitions';
import { categoryConfig } from '@/app/map/page';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';

const MapMarkers = ({ items }: { items: MapData[] }) => {
    const map = useMap();
    const [selectedMarker, setSelectedMarker] = useState<MapData | null>(null);
    const [markers, setMarkers] = useState<{ [key: string]: google.maps.Marker }>({});
    const clusterer = useRef<MarkerClusterer | null>(null);

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

    const setMarkerRef = (marker: google.maps.Marker | null, key: string) => {
        if (marker && markers[key] !== marker) {
            setMarkers((prev) => ({ ...prev, [key]: marker }));
        }
    };
    
    return (
        <>
            {items.map((item) => (
                 <AdvancedMarker
                    position={{lat: item.latitude, lng: item.longitude}}
                    key={item.id}
                    ref={marker => setMarkerRef(marker, item.id!)}
                    onClick={() => setSelectedMarker(item)}
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

const ExternalDataLayers = ({ datasets }: { datasets: MapDataset[] }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !datasets) return;

        const dataLayers: google.maps.Data[] = [];

        datasets.forEach((dataset, index) => {
            const layer = new google.maps.Data({ map: map });
            
            // Simple hashing to get a color for the dataset
            let hash = 0;
            for (let i = 0; i < dataset.name.length; i++) {
                hash = dataset.name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = `hsl(${hash % 360}, 90%, 30%)`;

            layer.setStyle({
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: color,
                    fillOpacity: 0.7,
                    strokeWeight: 0,
                }
            });
            layer.loadGeoJson(dataset.url);
            dataLayers.push(layer);
        });

        // Cleanup function
        return () => {
            dataLayers.forEach(layer => {
                layer.setMap(null);
            });
        };

    }, [map, datasets]);

    return null; // This component does not render anything itself
}

export default function MapComponent() {
    const { toast } = useToast();
    const [internalData, setInternalData] = useState<MapData[]>([]);
    const [externalDatasets, setExternalDatasets] = useState<MapDataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<MapDataCategory[]>(Object.keys(categoryConfig) as MapDataCategory[]);
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);

    useEffect(() => {
        Promise.all([
            getMapData(),
            getMapDatasets()
        ]).then(([internal, external]) => {
            setInternalData(internal);
            const visibleExternal = external.filter(d => d.isVisible);
            setExternalDatasets(visibleExternal);
            setSelectedDatasetIds(visibleExternal.map(d => d.id!));
        }).catch(() => toast({ variant: 'destructive', title: 'Gagal memuat data peta' }))
        .finally(() => setLoading(false));
    }, [toast]);
    
    const handleCategoryChange = (category: MapDataCategory, checked: boolean) => {
        setSelectedCategories(prev => 
            checked ? [...prev, category] : prev.filter(c => c !== category)
        );
    };

     const handleDatasetChange = (datasetId: string, checked: boolean) => {
        setSelectedDatasetIds(prev => 
            checked ? [...prev, datasetId] : prev.filter(id => id !== datasetId)
        );
    };

    const filteredInternalData = useMemo(() => {
        return internalData.filter(item => selectedCategories.includes(item.category));
    }, [internalData, selectedCategories]);

    const activeExternalDatasets = useMemo(() => {
        return (externalDatasets || []).filter(d => selectedDatasetIds.includes(d.id!));
    }, [externalDatasets, selectedDatasetIds]);

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
                            <SheetDescription>Pilih data yang ingin Anda tampilkan di peta.</SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                            <Label className="font-semibold">Lapisan Internal</Label>
                            <div className="space-y-2 mt-2">
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
                        </div>
                        <Separator />
                        <div className="py-4">
                             <Label className="font-semibold">Lapisan Eksternal (Datasets)</Label>
                            <div className="space-y-2 mt-2">
                                {externalDatasets.map(dataset => (
                                     <div key={dataset.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={dataset.id!}
                                            checked={selectedDatasetIds.includes(dataset.id!)}
                                            onCheckedChange={(checked) => handleDatasetChange(dataset.id!, !!checked)}
                                        />
                                        <Label htmlFor={dataset.id!} className="flex-1 cursor-pointer">{dataset.name}</Label>
                                    </div>
                                ))}
                                 {externalDatasets.length === 0 && <p className="text-xs text-muted-foreground">Tidak ada dataset eksternal yang tersedia.</p>}
                            </div>
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
                <MapMarkers items={filteredInternalData} />
                <ExternalDataLayers datasets={activeExternalDatasets} />
            </Map>
        </div>
    )
}
