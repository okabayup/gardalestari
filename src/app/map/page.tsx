
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { MapDataCategory } from '@/app/actions/map-data';
import { Sprout, Siren, ClipboardList, HelpingHand, HandCoins } from 'lucide-react';
import { useMemo } from 'react';

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
    // Memoizing the component prevents it from being re-rendered unnecessarily,
    // which is a key cause of the "Map container already initialized" error in Strict Mode.
    const mapComponent = useMemo(() => <Map />, []);

    return (
        <div className="h-screen w-full">
            {mapComponent}
        </div>
    );
}
