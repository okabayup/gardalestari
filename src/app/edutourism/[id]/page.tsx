
import { notFound } from 'next/navigation';
import { getEduwisataPackage, getAddons } from '@/app/actions/edutourism';
import { getBookedEduwisataDates } from '@/app/actions/booking';
import EduwisataDetailClient from '@/components/edutourism/EduwisataDetailClient';

export default async function EduwisataDetailPage({ params }: { params: { id: string } }) {
    if (!params || !params.id) {
        notFound();
    }
    const pkg = await getEduwisataPackage(params.id);

    if (!pkg) {
        notFound();
    }
    
    const [allAddons, bookedDates] = await Promise.all([
        getAddons(),
        getBookedEduwisataDates(params.id),
    ]);
    const availableAddons = allAddons.filter(addon => pkg.availableAddonIds.includes(addon.id));

    return (
        <EduwisataDetailClient
            pkg={pkg}
            addons={availableAddons}
            bookedDates={bookedDates}
        />
    )
}
