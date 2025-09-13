
'use client'

import Image from 'next/image';
import Link from 'next/link';
import { getAppSettings } from '@/app/actions/settings';
import { Users, Handshake, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

type Settings = {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
};

export default function Footer() {
    const [settings, setSettings] = useState<Settings>({});

    useEffect(() => {
        getAppSettings().then(setSettings);
    }, []);

    return (
        <footer className="border-t bg-card">
            <div className="container py-8">
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-2">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="Garda Lestari Logo" width={120} height={32} className="h-8 w-auto" />
                        </Link>
                        <p className="text-sm text-muted-foreground">Wadah bagi pemuda Indonesia untuk inovasi di sektor agro-maritim dan kehutanan.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold">Navigasi</h4>
                        <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <Link href="/tentang" className="hover:text-primary">Tentang Kami</Link>
                            <Link href="/#focus" className="hover:text-primary">Fokus</Link>
                            <Link href="/berita" className="hover:text-primary">Berita</Link>
                            <Link href="/ketentuan-layanan" className="hover:text-primary">Ketentuan Layanan</Link>
                            <Link href="/kebijakan-privasi" className="hover:text-primary">Kebijakan Privasi</Link>
                            <Link href="/hapus-data" className="hover:text-primary">Hapus Data</Link>
                        </nav>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold">Hubungi Kami</h4>
                        <div className="text-sm text-muted-foreground">
                           <p>Email: <a href="mailto:halo@gardalestari.org" className="text-primary hover:underline">halo@gardalestari.org</a></p>
                           <p>Telepon: <a href="https://wa.me/6285144904161" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">0851-4490-4161 (WhatsApp)</a></p>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                           <Link href={settings.instagram || '#'} target="_blank" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Heart size={20} /></Link>
                           <Link href={settings.linkedin || '#'} target="_blank" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><Handshake size={20} /></Link>
                           <Link href={settings.facebook || '#'} target="_blank" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Users size={20} /></Link>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Garda Muda Lestari. Semua hak dilindungi.</p>
                </div>
            </div>
        </footer>
    );
};
