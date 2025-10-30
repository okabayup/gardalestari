
'use client';

import { useEffect, useState } from 'react';
import type { EduwisataPackage, Addon } from '@/lib/definitions';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import BookingForm from '@/components/edutourism/BookingForm';

export default function EduwisataDetailClient({ pkg, addons, bookedDates }: { pkg: EduwisataPackage, addons: Addon[], bookedDates: Date[] }) {

    // You can add client-side specific logic here if needed in the future
    // For now, this component just handles rendering the client-side parts

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
                                        <div className="aspect-video relative overflow-hidden rounded-lg">
                                            <Image src={img} alt={`${pkg.title} - Gambar ${index + 1}`} fill className="object-cover"/>
                                        </div>
                                    </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                                </Carousel>
                            ) : (
                                <div className="aspect-video relative overflow-hidden rounded-lg">
                                    <Image src={pkg.imageUrl} alt={pkg.title} fill className="object-cover"/>
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
    )
}
