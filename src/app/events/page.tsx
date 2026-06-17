
'use server';

import MainLayout from '@/components/layout/MainLayout';
import EventCard from '@/components/events/EventCard';
import { getEvents, Event } from '@/app/actions/events';
import { Calendar } from 'lucide-react';
import BackButton from '@/components/utils/BackButton';

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <BackButton />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left">
                <h1 className="font-headline text-3xl font-bold">Acara Mendatang</h1>
                <p className="text-muted-foreground">Bergabunglah bersama kami untuk membuat perubahan</p>
            </div>
        </div>
        
        <div className="space-y-4 pt-4">
        {events.length > 0 ? (
            events.map((event) => (
            <EventCard key={event.id} event={event} />
            ))
        ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-8 w-8" />
                    <span>Belum ada acara yang akan datang.</span>
                </div>
            </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}
