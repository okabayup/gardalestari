import MainLayout from '@/components/layout/MainLayout';
import ProgramCard from '@/components/programs/ProgramCard';
import { programs } from '@/lib/placeholder-data';
import { Separator } from '@/components/ui/separator';

export default function ProgramsPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Our Programs</h1>
          <p className="text-muted-foreground">Initiatives for a sustainable future</p>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-semibold mb-4">Flagship Programs</h2>
          <div className="grid gap-6">
            {programs.flagship.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </div>
        
        <Separator className="my-8" />

        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-semibold mb-4">Ongoing Initiatives</h2>
          <div className="grid gap-6">
            {programs.ongoing.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
