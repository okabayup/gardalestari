
'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import L from 'leaflet';
import { MapData, MapDataCategory } from '@/app/actions/map-data';
import { categoryConfig } from '@/app/map/page';

interface MapProps {
    data: MapData[];
}

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


export default function Map({ data }: MapProps) {
    // This state ensures the map is only rendered on the client side
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
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
        <MapContainer
            center={[-2.548926, 118.014863]}
            zoom={5}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ height: 'calc(100vh - 3.5rem)', position: 'absolute', top: 0, left: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
                {data.map(item => (
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
