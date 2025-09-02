
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Program } from '@/app/actions/programs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';

interface ProgramCardProps extends Program {
  isPast?: boolean;
}

export default function ProgramCard({ id, title, description, imageUrl, imageHint, tags, startDate, endDate, isPast }: ProgramCardProps) {
  const formattedStartDate = format(startDate.toDate(), "d MMM yyyy", { locale: id });
  const formattedEndDate = format(endDate.toDate(), "d MMM yyyy", { locale: id });

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg flex flex-col", isPast && "opacity-70")}>
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={title}
          data-ai-hint={imageHint}
          fill
          className="object-cover"
        />
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded">Telah Berakhir</span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground pt-1">
          <CalendarIcon className="mr-2 h-4 w-4"/>
          <span>{formattedStartDate} - {formattedEndDate}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-muted-foreground text-sm mb-4 flex-grow">{description.substring(0, 100)}...</p>
        <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
      </CardContent>
      <div className="p-4 pt-0">
          <Button asChild className="w-full">
              <Link href={`/programs/${id}`}>
                  Lihat Detail <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
      </div>
    </Card>
  );
}
