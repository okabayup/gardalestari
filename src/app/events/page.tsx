import MainLayout from '@/components/layout/MainLayout';
import EventCard from '@/components/events/EventCard';
import { events } from '@/lib/placeholder-data';

export default function EventsPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Upcoming Events</h1>
          <p className="text-muted-foreground">Join us in making a difference</p>
        </div>
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.title} {...event} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
