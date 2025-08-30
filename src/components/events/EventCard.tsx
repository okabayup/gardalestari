import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '../ui/button';

interface EventCardProps {
  date: {
    day: string;
    month: string;
  };
  title: string;
  location: string;
  imageUrl: string;
  imageHint: string;
}

export default function EventCard({ date, title, location, imageUrl, imageHint }: EventCardProps) {
  return (
    <Card className="overflow-hidden">
        <div className="relative h-32 w-full">
            <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="p-4 flex items-center gap-4">
            <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold text-primary">{date.month}</span>
                <span className="text-2xl font-bold">{date.day}</span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{location}</p>
            </div>
            <Button size="sm">Details</Button>
        </div>
    </Card>
  );
}
