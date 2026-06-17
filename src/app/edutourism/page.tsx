
'use server';

import { getEduwisataPackages, EduwisataPackage } from '@/app/actions/edutourism';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mountain } from 'lucide-react';

const PackageCard = ({ pkg }: { pkg: EduwisataPackage }) => (
    <Card className="flex flex-col overflow-hidden group">
        <div className="relative h-48 w-full">
             <Image
                src={pkg.imageUrl}
                alt={pkg.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </div>
        <div className="p-6 flex flex-col flex-grow">
            <CardHeader className="p-0">
                <CardTitle className="leading-tight text-lg group-hover:text-primary transition-colors">{pkg.title}</CardTitle>
                <CardDescription>{pkg.duration}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-2 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{pkg.description}</p>
            </CardContent>
            <CardFooter className="p-0 mt-4 flex justify-between items-center">
                 <p className="font-bold text-lg">
                    Rp {pkg.price.toLocaleString('id-ID')}
                    <span className="text-sm font-normal text-muted-foreground">/orang</span>
                </p>
                <Button asChild variant="secondary" size="sm">
                    <Link href={`/edutourism/${pkg.id}`}>
                        Lihat Detail <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </div>
    </Card>
)

export default async function EduwisataPage() {
    const packages = await getEduwisataPackages();

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <LandingHeader />
            <main className="flex-1">
                <div className="container py-12 md:py-16">
                    <div className="text-center sm:text-left mb-8">
                        <h1 className="font-headline text-3xl font-bold">Eduwisata Garda Lestari</h1>
                        <p className="text-muted-foreground">Jelajahi, belajar, dan berkontribusi pada kelestarian alam bersama kami.</p>
                    </div>

                    {packages.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map(pkg => (
                                <PackageCard key={pkg.id} pkg={pkg} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Mountain className="h-12 w-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Belum Ada Paket Tersedia</h3>
                            <p>Saat ini belum ada paket eduwisata yang ditawarkan. Kembali lagi nanti!</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}
