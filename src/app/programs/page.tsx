
import MainLayout from '@/components/layout/MainLayout';
import ProgramCard from '@/components/programs/ProgramCard';
import { getPrograms, Program } from '@/app/actions/programs';
import { Separator } from '@/components/ui/separator';

// Revalidate every hour
export const revalidate = 3600;

export default async function ProgramsPage() {
  const allPrograms = await getPrograms();
  
  const flagshipPrograms = allPrograms.filter(p => p.category === 'flagship');
  const ongoingPrograms = allPrograms.filter(p => p.category === 'ongoing');

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold">Program Kami</h1>
          <p className="text-muted-foreground">Inisiatif untuk masa depan yang berkelanjutan.</p>
        </div>

        {flagshipPrograms.length > 0 && (
            <div className="space-y-6">
                <h2 className="font-headline text-2xl font-semibold mb-4">Program Unggulan</h2>
                <div className="grid gap-6">
                    {flagshipPrograms.map((program) => (
                    <ProgramCard key={program.id} {...program} />
                    ))}
                </div>
            </div>
        )}
        
        <Separator className="my-8" />

        {ongoingPrograms.length > 0 && (
            <div className="space-y-6">
                <h2 className="font-headline text-2xl font-semibold mb-4">Inisiatif Berkelanjutan</h2>
                <div className="grid gap-6">
                    {ongoingPrograms.map((program) => (
                    <ProgramCard key={program.id} {...program} />
                    ))}
                </div>
            </div>
        )}
        
        {allPrograms.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Belum ada program yang dipublikasikan.</p>
        )}
      </div>
    </MainLayout>
  );
}
