
'use client';

import { notFound, useParams } from 'next/navigation';
import { getEduwisataPackage, getAddons } from '@/app/actions/edutourism';
import { getBookedEduwisataDates } from '@/app/actions/booking';
import type { EduwisataPackage, Addon } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import BookingForm from '@/components/edutourism/BookingForm';

export default function EduwisataDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [pkg, setPkg] = useState<EduwisataPackage | null>(null);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [bookedDates, setBookedDates] = useState<Date[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                try {
                    const [pkgData, addonsData, bookedDatesData] = await Promise.all([
                        getEduwisataPackage(id),
                        getAddons(),
                        getBookedEduwisataDates(id),
                    ]);

                    if (!pkgData) {
                        notFound();
                        return;
                    }
                    
                    setPkg(pkgData);
                    // Filter addons based on the package's availableAddonIds
                    const availableAddons = addonsData.filter(addon => pkgData.availableAddonIds?.includes(addon.id));
                    setAddons(availableAddons);

                    setBookedDates(bookedDatesData);
                } catch (error) {
                    console.error("Failed to fetch edutourism details:", error);
                    notFound();
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    
    if (!pkg) {
        return notFound();
    }

    return (
        <div className="flex min-h-screen flex-col bg-secondary text-foreground">
            <LandingHeader />
            <main className="flex-1">
                <div className="container max-w-5xl mx-auto py-12 md:py-16">
                     <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        <div>
                             {pkg.images && pkg.images.length > 0 ? (
                                <Carousel className="w-full">
                                <CarouselContent>
                                    {[pkg.imageUrl, ...pkg.images].map((img, index) => (
                                    <CarouselItem key={index}>
                                        <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                                            <Image src={img} alt={`${pkg.title} - Gambar ${index + 1}`} fill className="object-contain"/>
                                        </div>
                                    </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                                </Carousel>
                            ) : (
                                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                                    <Image src={pkg.imageUrl} alt={pkg.title} fill className="object-contain"/>
                                </div>
                            )}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>{pkg.title}</CardTitle>
                                    <CardDescription>{pkg.duration}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{pkg.description}</p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="row-start-1 md:row-start-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Formulir Pemesanan</CardTitle>
                                    <CardDescription>
                                        Mulai dari <span className="font-bold text-primary text-lg">Rp {pkg.price.toLocaleString('id-ID')}</span>/orang
                                        (minimal {pkg.minParticipants} peserta)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <BookingForm pkg={pkg} addons={addons} bookedDates={bookedDates} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
