import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgramCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
}

export default function ProgramCard({ title, description, imageUrl, imageHint }: ProgramCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={title}
          data-ai-hint={imageHint}
          fill
          className="object-cover"
        />
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
