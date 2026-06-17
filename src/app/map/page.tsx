
'use client';

import { Sprout, Siren, ClipboardList, HelpingHand, HandCoins } from 'lucide-react';
import type { MapDataCategory } from '@/lib/definitions';
import { APIProvider } from '@vis.gl/react-google-maps';
import Map from '@/components/map/Map';

export const categoryConfig: Record<MapDataCategory, { label: string; icon: React.ElementType; color: string }> = {
    potensi: { label: 'Potensi', icon: Sprout, color: '#22c55e' }, // green-500
    permasalahan: { label: 'Permasalahan', icon: Siren, color: '#ef4444' }, // red-500
    program: { label: 'Program', icon: ClipboardList, color: '#3b82f6' }, // blue-500
    kegiatan: { label: 'Kegiatan', icon: HelpingHand, color: '#eab308' }, // yellow-500
    dana: { label: 'Dana', icon: HandCoins, color: '#a855f7' }, // purple-500
};

export default function MapPage() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Kunci API Google Maps belum dikonfigurasi.</p>
            </div>
        );
    }
    
    return (
        <div className="h-screen w-full">
            <APIProvider apiKey={apiKey}>
                <Map />
            </APIProvider>
        </div>
    );
}
