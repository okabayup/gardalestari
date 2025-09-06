
'use client';

import dynamic from 'next/dynamic';
import { Loader2, HandCoins, Sprout, Siren, ClipboardList, HelpingHand } from 'lucide-react';
import type { MapDataCategory } from '@/app/actions/map-data';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/map/Map'), { 
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
    return (
        <div className="relative h-full w-full">
            <MapComponent />
        </div>
    );
}
