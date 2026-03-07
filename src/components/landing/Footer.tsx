'use client'

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin, Facebook, Twitter, Globe, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#D1D9CD] text-accent pt-20 pb-12 rounded-t-[5rem]">
            <div className="container px-6">
                <div className="grid gap-12 md:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="Garda Lestari Logo" width={160} height={42} className="h-10 w-auto" />
                        </Link>
                        <p className="text-sm font-medium text-accent/70 leading-relaxed">
                            Wadah bagi pemuda Indonesia untuk inovasi di sektor agro-maritim dan kehutanan. Bersama kita jaga kelestarian alam nusantara.
                        </p>
                    </div>

                    {/* Quick Links 1 */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-xl uppercase tracking-tighter">About</h4>
                        <nav className="flex flex-col gap-3 text-sm font-medium text-accent/60">
                            <Link href="/tentang" className="hover:text-primary transition-colors">Who We Are</Link>
                            <Link href="/tentang" className="hover:text-primary transition-colors">Our Story</Link>
                            <Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
                        </nav>
                    </div>

                    {/* Quick Links 2 */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-xl uppercase tracking-tighter">Service</h4>
                        <nav className="flex flex-col gap-3 text-sm font-medium text-accent/60">
                            <Link href="/programs" className="hover:text-primary transition-colors">Nature</Link>
                            <Link href="/donate" className="hover:text-primary transition-colors">Donation</Link>
                            <Link href="/action" className="hover:text-primary transition-colors">Action</Link>
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-xl uppercase tracking-tighter">Contact Info</h4>
                        <ul className="space-y-4 text-sm font-medium text-accent/60">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-primary shrink-0" />
                                <span>Jl. Melati No. 123, Jakarta Selatan, Indonesia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-primary shrink-0" />
                                <span>+62 812 3456 7890</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-primary shrink-0" />
                                <span>halo@gardalestari.org</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-accent/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-accent/40 uppercase tracking-widest">&copy; {new Date().getFullYear()} Garda Muda Lestari. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        {[Instagram, Linkedin, Facebook, Twitter, Globe].map((Icon, i) => (
                            <Link key={i} href="#" className="w-10 h-10 rounded-full border border-accent/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                                <Icon size={18} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}